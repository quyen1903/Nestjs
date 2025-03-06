import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateCommentDTO{
    @IsString()
    @IsNotEmpty()
    commentProductId: string;

    @IsString()
    @IsNotEmpty()
    commentUserId: string;

    @IsString()
    @IsNotEmpty()
    commentContent: string

    @IsString()
    @IsOptional()
    commentParentId: string | null
}