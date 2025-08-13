import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { CreateCommentDTO } from './dto/create-comment.dto';
import { GetCommentDTO } from './dto/get-comment.dto';
import { DeleteCommentDTO } from './dto/delete-comment.dto';
import { Factory } from '../product/services/factory.service';

/**
 * Depth first search preorder traversal (Data structure and  algorithm perspective)
 * we implementing nested set model (database perspective)
 * because of each node store left and right value, we need 2 more value
 * to add value for new node, first we increase left and right value
 * of all node which is right-hand side
 * 
*/

@Injectable()
export class CommentService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly factory: Factory
    ){}

    //legacy code, this model use Nested set model, but now we switch to Closure table

    /**
     * remember to use transaction 
     * @param param0 
     * @returns create a new comment
     */
    async createComment({commentProductId, commentUserId, commentContent, commentParentId = null}: CreateCommentDTO){

        /*
            quick note here: "" in javascript is falsy (empty string)
        */
        let rightValue: number;
        if(commentParentId){
            // use transaction to make sure thing are atomic

            //reply comment
            const parentComment = await this.prismaService.comment.findFirst({
                where:{id: commentParentId}
            });

            if(!parentComment) throw new NotFoundException('not found parent comment');

            rightValue = parentComment.commentRight;

            // transaction for atomic
            await this.prismaService.$transaction(async(tx)=>{

                await tx.comment.updateMany({
                    where:{
                        commentProductId: commentProductId,
                        commentRight: { gte: rightValue }

                    },data:{
                        commentRight:{ increment:2 }
                    }
                });

                await tx.comment.updateMany({
                    where:{
                        commentProductId: commentProductId,
                        commentLeft: { gte  : rightValue }

                    },data:{
                        commentLeft:{ increment:2 }
                    }
                });
            })


        }else{
            /**
             * parent comment not existed 
             */

            const maxRightValue = await this.prismaService.comment.findFirst({
                where:{ commentProductId },
                select:{ commentRight: true},
                orderBy:{ commentRight: 'desc'}
            })

            rightValue = maxRightValue ? maxRightValue.commentRight + 1 : 1;

        }

        return this.prismaService.comment.create({
            data: {
                commentProductId,
                commentUserId,
                commentContent,
                commentParentId,
                commentLeft: rightValue,
                commentRight: rightValue + 1
            }
        });
    }

    /**
     * find all comment belong to same parent
     * if there is no parent we return all comment of this product
    */
    async getCommentsByParentId(comment: GetCommentDTO){

        if(comment.commentParentId){
            const parent = await this.prismaService.comment.findFirst({
                where:{id: comment.commentParentId}
            });

            if(!parent) throw new NotFoundException('Not found comment for product');

            const comments = await this.prismaService.comment.findMany({
                where:{
                    commentProductId: comment.commentProductId,
                    commentLeft:{ gt: parent.commentLeft},
                    commentRight:{ lt: parent.commentRight},
                    isActive: true
                },select:{
                    commentLeft: true,
                    commentRight: true,
                    commentContent: true,
                    commentParentId: true
                },orderBy:{
                    commentLeft:'asc'
                }
            })
            return comments
        }

        const comments = await this.prismaService.comment.findMany({
            where:{
                commentProductId: comment.commentProductId,
                commentParentId: comment.commentParentId, //equal null
                isActive: true
            },select:{
                commentLeft: true,
                commentRight: true,
                commentContent: true,
                commentParentId: true
            },orderBy:{
                commentLeft:'asc'
            }
        })

        return comments
    }

    /**
     * we implementing nested set model
     * first thing  first, we remove this node, then we update left value and right value of
     * all node which right hand side of deleted node
     * remember, if this node is not leaf, all child node also be deleted, too
    */

    async deleteComments(deleted: DeleteCommentDTO){
        const foundProduct = await this.factory.findProduct(deleted.commentProductId)
        if(!foundProduct) throw new NotFoundException('product not found')
        
        //1 determine left/right value
        const comment =  await this.prismaService.comment.findUnique({
            where:{id: deleted.id}
        });

        if(!comment) throw new NotFoundException('comment not found');

        const leftValue = comment.commentLeft
        const rightValue = comment.commentRight

        //2 caculate width 
        const width = rightValue - leftValue +1

        //use transaction for atomic 
        await this.prismaService.$transaction(async(tx)=>{

            //3delete all subcomment
            await tx.comment.deleteMany({
                where:{
                    commentProductId: deleted.commentProductId,
                    commentLeft: { gte: leftValue, lte: rightValue}
                }
            })

            //4 update remain left/right value
            await tx.comment.updateMany({
                where:{
                    commentProductId: deleted.commentProductId,
                    commentRight:{ gt: rightValue }
                },
                data:{
                    commentRight: { increment: -width}
                }
            })

            await tx.comment.updateMany({
                where:{
                    commentProductId: deleted.commentProductId,
                    commentLeft: { gt: rightValue}
                },
                data:{
                    commentLeft: { increment: -width}
                }
            })
        })


        return true
    }


}
