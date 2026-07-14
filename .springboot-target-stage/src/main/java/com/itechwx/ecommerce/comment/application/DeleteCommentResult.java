package com.itechwx.ecommerce.comment.application;

public record DeleteCommentResult(
        String deletedComment,
        int deletedDescendants,
        String message
) {
}
