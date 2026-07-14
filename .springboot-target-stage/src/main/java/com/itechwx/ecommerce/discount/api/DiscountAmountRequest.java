package com.itechwx.ecommerce.discount.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record DiscountAmountRequest(
        @NotBlank @Size(max = 100) String discountCode,
        @Size(max = 128) String discountUserId,
        @NotBlank @Size(max = 128) String discountShopId,
        @NotEmpty @Size(max = 100) List<@Valid DiscountAmountProductRequest> discountProducts
) {
}
