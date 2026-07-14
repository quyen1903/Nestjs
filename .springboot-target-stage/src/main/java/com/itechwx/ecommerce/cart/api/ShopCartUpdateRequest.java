package com.itechwx.ecommerce.cart.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ShopCartUpdateRequest(
        @Size(max = 128) String shopId,
        @NotEmpty @Size(max = 100) List<@Valid CartUpdateProductRequest> itemProducts,
        Integer version
) {
}
