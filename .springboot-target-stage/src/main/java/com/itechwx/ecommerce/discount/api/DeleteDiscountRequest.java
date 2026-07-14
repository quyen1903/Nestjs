package com.itechwx.ecommerce.discount.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DeleteDiscountRequest(@NotBlank @Size(max = 100) String discountCode) {
}
