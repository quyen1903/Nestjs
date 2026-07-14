package com.itechwx.ecommerce.discount.api;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record DiscountAmountProductRequest(
        @NotBlank @Size(max = 128) String productId,
        @Min(1) int quantity,
        BigDecimal price
) {
}
