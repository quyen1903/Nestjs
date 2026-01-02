import { Body, Controller, Delete, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CommentService } from './comment.service';
import { RoleGuard } from '../auth/auth-role.guard';
import { Roles } from '../auth/roles.decorator';
import { AccountType } from 'prisma/generated/prisma';
import { CreateCommentDTO, DeleteCommentDTO } from './dto/comment.dto';
import { AccessTokenGuard } from '../auth/access-token.guard';

@Controller('comment')
@Roles(AccountType.USER)
export class CommentController {
    constructor(private readonly commentService: CommentService) {}

    @UseGuards(AccessTokenGuard, RoleGuard)
    @Post('')
    createComment(@Body() payload: CreateCommentDTO){
        return this.commentService.createComment(payload)
    }

    @UseGuards(AccessTokenGuard, RoleGuard)
    @Get('')
    getComment(
        @Query('commentProductId') commentProductId: string,
        @Query('commentParentId')commentParentId: string | null
    ){
        return this.commentService.getCommentsByParentId({commentProductId, commentParentId})
    }

    @UseGuards(AccessTokenGuard, RoleGuard)
    @Delete('')
    deleteComment(@Body() payload: DeleteCommentDTO){
        return this.commentService.deleteComments(payload)
    }
}
