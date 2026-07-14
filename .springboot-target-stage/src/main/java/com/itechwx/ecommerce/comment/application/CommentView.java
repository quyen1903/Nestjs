package com.itechwx.ecommerce.comment.application;

public record CommentView(
        String id,
        String content,
        CommentAuthorView author,
        long createdAt,
        long updatedAt,
        int likesCount,
        int dislikesCount,
        int repliesCount,
        boolean edited,
        Long editedAt,
        boolean pinned,
        String status,
        int depth
) {
}
