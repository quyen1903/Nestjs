// dto/create-comment.dto.ts
import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateCommentDTO {
    @ApiProperty({ example: 'spu_123' })
    @IsString()
    @IsNotEmpty()
    commentProductId: string;

    @ApiProperty({ example: 'user_123' })
    @IsString()
    @IsNotEmpty()
    commentUserId: string;

    @ApiProperty({ example: 'Great product, fast shipping.' })
    @IsString()
    @IsNotEmpty()
    commentContent: string;

    @ApiPropertyOptional({ example: 'comment_123' })
    @IsString()
    @IsOptional()
    commentParentId?: string; // Made optional instead of nullable
}

// dto/get-comment.dto.ts
export class GetCommentDTO {
    @ApiProperty({ example: 'spu_123' })
    @IsString()
    @IsNotEmpty()
    commentProductId: string;

    @ApiPropertyOptional({ example: 'comment_123' })
    @IsString()
    @IsOptional()
    commentParentId?: string;
}

// dto/delete-comment.dto.ts
export class DeleteCommentDTO {
    @ApiProperty({ example: 'comment_123' })
    @IsString()
    @IsNotEmpty()
    id: string;

    @ApiProperty({ example: 'spu_123' })
    @IsString()
    @IsNotEmpty()
    commentProductId: string;
}
