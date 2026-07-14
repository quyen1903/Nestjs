package com.itechwx.ecommerce.checkout.application;

import java.util.List;

public record CheckoutCommand(
        String cartId,
        String shippingAddress,
        List<CheckoutShopSelection> shops
) {
    public CheckoutCommand {
        shops = List.copyOf(shops);
    }
}
