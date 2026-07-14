package com.itechwx.ecommerce.comment.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCommentRequest(
        @NotBlank @Size(max = 128) String commentProductId,
        @NotBlank @Size(max = 128) String commentUserId,
        @NotBlank @Size(max = 4_000) String commentContent,
        @Size(max = 128) String commentParentId
) {
}
