package com.itechwx.ecommerce.cart.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DeleteCartItemRequest(@NotBlank @Size(max = 128) String productId) {
}
