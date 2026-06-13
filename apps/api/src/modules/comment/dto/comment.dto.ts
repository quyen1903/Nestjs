// dto/create-comment.dto.ts
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateCommentDTO {
    @IsString()
    @IsNotEmpty()
    commentProductId: string;

    @IsString()
    @IsNotEmpty()
    commentUserId: string;

    @IsString()
    @IsNotEmpty()
    commentContent: string;

    @IsString()
    @IsOptional()
    commentParentId?: string; // Made optional instead of nullable
}

// dto/get-comment.dto.ts
export class GetCommentDTO {
    @IsString()
    @IsNotEmpty()
    commentProductId: string;

    @IsString()
    @IsOptional()
    commentParentId?: string;
}

// dto/delete-comment.dto.ts
export class DeleteCommentDTO {
    @IsString()
    @IsNotEmpty()
    id: string;

    @IsString()
    @IsNotEmpty()
    commentProductId: string;
}
