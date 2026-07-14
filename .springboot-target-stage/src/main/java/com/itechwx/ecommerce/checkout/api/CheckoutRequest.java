package com.itechwx.ecommerce.checkout.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CheckoutRequest(
        @NotBlank @Size(max = 128) String cartId,
        @Size(max = 500) String shippingAddress,
        @NotEmpty @Size(max = 50) List<@Valid CheckoutShopRequest> shopOrderIds
) {
    public CheckoutRequest {
        shopOrderIds = shopOrderIds == null ? List.of() : List.copyOf(shopOrderIds);
    }
}
