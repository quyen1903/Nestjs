package com.itechwx.ecommerce.checkout.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CheckoutDiscountRequest(
        @NotBlank @Size(max = 128) String shopId,
        @NotBlank @Size(max = 128) String discountId,
        @NotBlank @Size(max = 100) String codeId
) {
}
