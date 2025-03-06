import { Comment } from "@prisma/client";

export type DeleteCommentDTO = Pick<Comment, 'id' | 'commentProductId'>