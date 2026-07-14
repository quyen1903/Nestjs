package com.itechwx.ecommerce.checkout.api;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CheckoutProductRequest(
        @DecimalMin("0") BigDecimal price,
        @Min(1) @Max(10_000) int quantity,
        @NotBlank @Size(max = 128) String productId,
        @Size(max = 128) String shopId,
        @Size(max = 300) String name
) {
}
