package com.itechwx.ecommerce.checkout.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CheckoutShopRequest(
        @NotBlank @Size(max = 128) String shopId,
        @Size(max = 10) List<@Valid CheckoutDiscountRequest> shopDiscounts,
        @NotEmpty @Size(max = 100) List<@Valid CheckoutProductRequest> itemProducts
) {
    public CheckoutShopRequest {
        shopDiscounts = shopDiscounts == null ? List.of() : List.copyOf(shopDiscounts);
        itemProducts = itemProducts == null ? List.of() : List.copyOf(itemProducts);
    }
}
