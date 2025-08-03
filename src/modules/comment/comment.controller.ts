import { Body, Controller, Delete, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CommentService } from './comment.service';
import { RoleGuard } from '../auth/auth-role.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from 'src/shared/enums/role.enum';
import { CreateCommentDTO } from './dto/create-comment.dto';
import { DeleteCommentDTO } from './dto/delete-comment.dto';
import { UserAuthGuard } from '../auth/user-auth/auth-jwt.guard';

@Controller('comment')
export class CommentController {
    constructor(private readonly commentService: CommentService) {}

    @UseGuards(UserAuthGuard, RoleGuard)
    @Roles(Role.User)
    @Post('')
    createComment(@Body() payload: CreateCommentDTO){
        return this.commentService.createComment(payload)
    }

    @UseGuards(UserAuthGuard, RoleGuard)
    @Roles(Role.User)
    @Get('')
    getComment(
        @Query('commentProductId') commentProductId: string,
        @Query('commentParentId')commentParentId: string | null
    ){
        return this.commentService.getCommentsByParentId({commentProductId, commentParentId})
    }

    @UseGuards(UserAuthGuard, RoleGuard)
    @Roles(Role.User)
    @Delete('')
    deleteComment(@Body() payload: DeleteCommentDTO){
        return this.commentService.deleteComments(payload)
    }
}
