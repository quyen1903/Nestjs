import { Body, Controller, Delete, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CommentService } from './comment.service';
import { RoleGuard } from '../auth/auth-role.guard';
import { Roles } from '../auth/roles.decorator';
import { AccountType } from 'src/database/types';
import { CreateCommentDTO, DeleteCommentDTO } from './dto/comment.dto';
import { JwtAccessAuthGuard } from '../auth/guards/jwt-access-auth.guard';
import { ApiEndpoint } from 'src/shared/swagger/api-docs.decorator';

@Controller('comment')
@Roles(AccountType.USER)
@ApiTags('Comment')
export class CommentController {
    constructor(private readonly commentService: CommentService) {}

    @UseGuards(JwtAccessAuthGuard, RoleGuard)
    @Post('')
    @ApiEndpoint({
        summary: 'Create a product comment',
        auth: true,
        body: { type: CreateCommentDTO },
        responses: [{ status: 201, description: 'Comment created' }],
    })
    createComment(@Body() payload: CreateCommentDTO){
        return this.commentService.createComment(payload)
    }

    @UseGuards(JwtAccessAuthGuard, RoleGuard)
    @Get('')
    @ApiEndpoint({
        summary: 'Get product comments',
        auth: true,
        queries: [
            { name: 'commentProductId', required: true, example: 'spu_123' },
            { name: 'commentParentId', required: false, example: 'comment_123' },
        ],
    })
    getComment(
        @Query('commentProductId') commentProductId: string,
        @Query('commentParentId')commentParentId: string | null
    ){
        return this.commentService.getCommentsByParentId({commentProductId, commentParentId})
    }

    @UseGuards(JwtAccessAuthGuard, RoleGuard)
    @Delete('')
    @ApiEndpoint({
        summary: 'Delete a comment',
        auth: true,
        body: { type: DeleteCommentDTO },
    })
    deleteComment(@Body() payload: DeleteCommentDTO){
        return this.commentService.deleteComments(payload)
    }
}
