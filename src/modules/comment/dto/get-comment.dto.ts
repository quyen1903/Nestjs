import { Comment } from "@prisma/client";

export type GetCommentDTO = Pick<Comment, 'commentProductId' | 'commentParentId'>