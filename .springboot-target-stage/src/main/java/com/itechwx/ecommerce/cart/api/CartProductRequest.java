package com.itechwx.ecommerce.cart.api;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CartProductRequest(
        @NotBlank @Size(max = 128) String productId,
        @Min(1) int quantity
) {
}
