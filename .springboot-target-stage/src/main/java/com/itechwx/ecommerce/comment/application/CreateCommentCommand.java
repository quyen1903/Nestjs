package com.itechwx.ecommerce.comment.application;

public record CreateCommentCommand(
        String productId,
        String content,
        String parentId
) {
}
