package com.itechwx.ecommerce.cart.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateCartRequest(
        @NotEmpty @Size(max = 100) List<@Valid ShopCartUpdateRequest> shopOrderIds
) {
}
