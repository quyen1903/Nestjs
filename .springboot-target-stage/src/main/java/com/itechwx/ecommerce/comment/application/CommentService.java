package com.itechwx.ecommerce.comment.application;

import java.util.List;

public interface CommentService {

    CommentView create(String userId, CreateCommentCommand command);

    List<CommentView> find(String productId, String parentId);

    DeleteCommentResult delete(String userId, String productId, String commentId);
}
