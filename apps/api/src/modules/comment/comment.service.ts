import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { ProductService } from '../product/product.service';
import { 
    CreateCommentDTO, 
    GetCommentDTO, 
    DeleteCommentDTO 
} from './dto/comment.dto';

@Injectable()
export class CommentService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly productService: ProductService,
    ){}

    /**
     * Creates a comment using closure table model with transaction
     */
    async createComment({commentProductId, commentUserId, commentContent, commentParentId = null}: CreateCommentDTO){
        
        // Verify product exists (outside transaction - read-only)
        const foundProduct = await this.productService.findProduct(commentProductId);
        if (!foundProduct) throw new NotFoundException('Product not found');

        // If replying to a comment, verify parent exists (outside transaction - read-only)
        if (commentParentId) {
            const parentComment = await this.prismaService.comment.findFirst({
                where: { 
                    id: commentParentId,
                    isActive: true 
                }
            });
            if (!parentComment) throw new NotFoundException('Parent comment not found');
        }

        // Use transaction for all write operations
        return await this.prismaService.$transaction(async (tx) => {
            // 1. Create the comment
            const comment = await tx.comment.create({
                data: {
                    content: commentContent,
                    authorId: commentUserId,
                    spuId: commentProductId,
                    targetType: 'PRODUCT',
                    targetId: commentProductId,
                    threadId: commentParentId ? null : null // Will be set later for root comments
                }
            });

            // 2. Build closure table entries
            const closureEntries = [];

            // Self-reference (every node is its own ancestor at depth 0)
            closureEntries.push({
                ancestorId: comment.id,
                descendantId: comment.id,
                depth: 0
            });

            if (commentParentId) {
                // Get all ancestors of the parent comment
                const parentAncestors = await tx.commentClosureTable.findMany({
                    where: { descendantId: commentParentId }
                });

                // Add all parent's ancestors as this comment's ancestors
                for (const ancestor of parentAncestors) {
                    closureEntries.push({
                        ancestorId: ancestor.ancestorId,
                        descendantId: comment.id,
                        depth: ancestor.depth + 1
                    });
                }

                // 3. Update parent's reply count
                await tx.comment.update({
                    where: { id: commentParentId },
                    data: { repliesCount: { increment: 1 } }
                });
            } else {
                // Root comment - set threadId to its own ID
                await tx.comment.update({
                    where: { id: comment.id },
                    data: { threadId: comment.id }
                });
            }

            // 4. Insert all closure table entries at once
            await tx.commentClosureTable.createMany({
                data: closureEntries
            });

            // 5. Return the created comment with relations
            return await tx.comment.findUnique({
                where: { id: comment.id },
                include: {
                    author: {
                        include: {
                            profile: true
                        }
                    }
                }
            });
        });
    }

    /**
     * Soft delete with transaction
     */
    async deleteComments(deleted: DeleteCommentDTO){
        // Verify product exists (outside transaction - read-only)
        const foundProduct = await this.productService.findProduct(deleted.commentProductId);
        if (!foundProduct) throw new NotFoundException('Product not found');
        
        // Verify comment exists (outside transaction - read-only)
        const comment = await this.prismaService.comment.findUnique({
            where: { id: deleted.id, isActive: true }
        });
        if (!comment) throw new NotFoundException('Comment not found');

        // Use transaction for all write operations
        return await this.prismaService.$transaction(async (tx) => {
            // 1. Get all descendants (children) that will also be soft deleted
            const descendants = await tx.comment.findMany({
                where: {
                    ancestors: {
                        some: { ancestorId: deleted.id }
                    },
                    isActive: true,
                    id: { not: deleted.id } // Don't include self
                }
            });

            // 2. Soft delete the comment and all its descendants
            await tx.comment.updateMany({
                where: {
                    OR: [
                        { id: deleted.id },
                        {
                            ancestors: {
                                some: { ancestorId: deleted.id }
                            }
                        }
                    ]
                },
                data: {
                    isActive: false,
                    isDeleted: true,
                    content: '[deleted]' // Clear sensitive content
                }
            });

            // 3. Update parent's reply count if this wasn't a root comment
            const parentRelation = await tx.commentClosureTable.findFirst({
                where: {
                    descendantId: deleted.id,
                    depth: 1 // Direct parent
                }
            });

            if (parentRelation) {
                await tx.comment.update({
                    where: { id: parentRelation.ancestorId },
                    data: { 
                        repliesCount: { 
                            decrement: descendants.length + 1 // +1 for the comment itself
                        } 
                    }
                });
            }

            return {
                deletedComment: deleted.id,
                deletedDescendants: descendants.length,
                message: 'Comment and replies soft deleted successfully'
            };
        });
    }

    /**
     * Bulk operations with transaction
     */
    async moveCommentToNewParent(commentId: string, newParentId: string) {
        return await this.prismaService.$transaction(async (tx) => {
            // 1. Remove old closure table entries for the subtree
            const subtreeIds = await tx.commentClosureTable.findMany({
                where: { ancestorId: commentId },
                select: { descendantId: true }
            });

            // Delete old ancestor relationships (except self-references)
            await tx.commentClosureTable.deleteMany({
                where: {
                    descendantId: { in: subtreeIds.map(s => s.descendantId) },
                    depth: { gt: 0 }
                }
            });

            // 2. Rebuild closure table for the moved subtree
            for (const subtreeNode of subtreeIds) {
                // Get new parent's ancestors
                const newParentAncestors = await tx.commentClosureTable.findMany({
                    where: { descendantId: newParentId }
                });

                // Create new ancestor relationships
                const newClosureEntries = newParentAncestors.map(ancestor => ({
                    ancestorId: ancestor.ancestorId,
                    descendantId: subtreeNode.descendantId,
                    depth: ancestor.depth + 1
                }));

                await tx.commentClosureTable.createMany({
                    data: newClosureEntries
                });
            }

            // 3. Update reply counts
            // ... (implementation depends on requirements)
        });
    }

    async getCommentsByParentId(comment: GetCommentDTO) {
        if (comment.commentParentId) {
            // Get all descendants of a specific parent
            const parent = await this.prismaService.comment.findFirst({
                where: { 
                    id: comment.commentParentId,
                    isActive: true 
                }
            });

            if (!parent) throw new NotFoundException('Parent comment not found');

            const comments = await this.prismaService.comment.findMany({
                where: {
                    spuId: comment.commentProductId,
                    ancestors: {
                        some: { 
                            ancestorId: comment.commentParentId 
                        }
                    },
                    isActive: true,
                    id: { not: comment.commentParentId } // Exclude the parent itself
                },
                include: {
                    author: {
                        include: {
                            profile: {
                                select: {
                                    name: true,
                                    avatar: true
                                }
                            }
                        }
                    },
                    descendants: {
                        select: { 
                            descendantId: true, 
                            depth: true 
                        }
                    }
                },
                orderBy: { createdAt: 'asc' }
            });

            return this.buildCommentTree(comments);
        }

        // Get root comments (comments with no parent - depth 0 only)
        const rootComments = await this.prismaService.comment.findMany({
            where: {
                spuId: comment.commentProductId,
                ancestors: {
                    every: {
                        depth: 0 // Only self-references (root comments)
                    }
                },
                isActive: true
            },
            include: {
                author: {
                    include: {
                        profile: {
                            select: {
                                name: true,
                                avatar: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        return rootComments;
    }

    /**
     * Get direct children of a comment (depth = 1)
     */
    async getDirectReplies(parentId: string) {
        const directReplies = await this.prismaService.comment.findMany({
            where: {
                ancestors: {
                    some: { 
                        ancestorId: parentId,
                        depth: 1 // Direct children only
                    }
                },
                isActive: true
            },
            include: {
                author: {
                    include: {
                        profile: {
                            select: {
                                name: true,
                                avatar: true
                            }
                        }
                    }
                },
                descendants: {
                    select: {
                        descendantId: true,
                        depth: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        return this.buildCommentTree(directReplies);
    }

    /**
     * Get full comment thread starting from root
     */
    async getFullThread(threadId: string) {
        const threadComments = await this.prismaService.comment.findMany({
            where: {
                OR: [
                    { id: threadId }, // Root comment
                    {
                        ancestors: {
                            some: { ancestorId: threadId }
                        }
                    }
                ],
                isActive: true
            },
            include: {
                author: {
                    include: {
                        profile: {
                            select: {
                                name: true,
                                avatar: true
                            }
                        }
                    }
                },
                descendants: {
                    select: {
                        descendantId: true,
                        depth: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        return this.buildNestedCommentTree(threadComments);
    }

    /**
     * Helper method to build nested comment structure
     * Creates a hierarchical tree structure for better frontend consumption
     */
    private buildCommentTree(comments: any[]) {
        return comments.map(comment => {
            // Find the depth of this comment relative to its root
            const maxDepth = Math.max(
                ...comment.descendants.map((d: any) => d.depth),
                0
            );
            
            return {
                id: comment.id,
                content: comment.content,
                author: {
                    id: comment.author.id,
                    name: comment.author.profile?.name,
                    avatar: comment.author.profile?.avatar
                },
                createdAt: comment.createdAt,
                updatedAt: comment.updatedAt,
                likesCount: comment.likesCount,
                dislikesCount: comment.dislikesCount,
                repliesCount: comment.repliesCount,
                isEdited: comment.isEdited,
                editedAt: comment.editedAt,
                isPinned: comment.isPinned,
                status: comment.status,
                depth: maxDepth
            };
        });
    }

    /**
     * Helper method to build a proper nested tree structure
     * For complex hierarchical display
     */
    private buildNestedCommentTree(comments: any[]) {
        const commentMap = new Map();
        const rootComments = [];

        // First pass: create comment objects and map them
        comments.forEach(comment => {
            const processedComment = {
                id: comment.id,
                content: comment.content,
                author: {
                    id: comment.author.id,
                    name: comment.author.profile?.name,
                    avatar: comment.author.profile?.avatar
                },
                createdAt: comment.createdAt,
                updatedAt: comment.updatedAt,
                likesCount: comment.likesCount,
                dislikesCount: comment.dislikesCount,
                repliesCount: comment.repliesCount,
                isEdited: comment.isEdited,
                editedAt: comment.editedAt,
                isPinned: comment.isPinned,
                status: comment.status,
                children: [],
                depth: 0
            };
            
            commentMap.set(comment.id, processedComment);
        });

        // Second pass: build the tree structure using closure table relationships
        comments.forEach(comment => {
            const currentComment = commentMap.get(comment.id);
            
            // Find direct parent (depth = 1 in ancestors)
            const directParentRelation = comment.ancestors?.find((a: any) => a.depth === 1);
            
            if (directParentRelation) {
                const parentComment = commentMap.get(directParentRelation.ancestorId);
                if (parentComment) {
                    currentComment.depth = directParentRelation.depth;
                    parentComment.children.push(currentComment);
                }
            } else {
                // This is a root comment
                rootComments.push(currentComment);
            }
        });

        // Sort children by creation time
        const sortChildren = (comment: any) => {
            comment.children.sort((a: any, b: any) => 
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
            comment.children.forEach(sortChildren);
        };

        rootComments.forEach(sortChildren);
        
        return rootComments;
    }

    /**
     * Get paginated comments for a product
     */
    async getPaginatedComments(productId: string, page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;
        
        const [comments, total] = await Promise.all([
            this.prismaService.comment.findMany({
                where: {
                    spuId: productId,
                    ancestors: {
                        every: { depth: 0 } // Only root comments
                    },
                    isActive: true
                },
                include: {
                    author: {
                        include: {
                            profile: {
                                select: {
                                    name: true,
                                    avatar: true
                                }
                            }
                        }
                    }
                },
                orderBy: [
                    { isPinned: 'desc' }, // Pinned comments first
                    { createdAt: 'desc' }  // Newest first
                ],
                skip,
                take: limit
            }),
            this.prismaService.comment.count({
                where: {
                    spuId: productId,
                    ancestors: {
                        every: { depth: 0 }
                    },
                    isActive: true
                }
            })
        ]);

        return {
            comments: this.buildCommentTree(comments),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        };
    }

    /**
     * Search comments by content
     */
    async searchComments(productId: string, searchTerm: string) {
        return await this.prismaService.comment.findMany({
            where: {
                spuId: productId,
                content: {
                    contains: searchTerm,
                    mode: 'insensitive'
                },
                isActive: true
            },
            include: {
                author: {
                    include: {
                        profile: {
                            select: {
                                name: true,
                                avatar: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

}
