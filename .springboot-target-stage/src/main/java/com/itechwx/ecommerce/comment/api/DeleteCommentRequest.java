package com.itechwx.ecommerce.comment.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DeleteCommentRequest(
        @NotBlank @Size(max = 128) String id,
        @NotBlank @Size(max = 128) String commentProductId
) {
}
