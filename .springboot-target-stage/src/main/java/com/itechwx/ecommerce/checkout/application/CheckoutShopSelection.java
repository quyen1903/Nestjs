package com.itechwx.ecommerce.checkout.application;

import java.util.List;

public record CheckoutShopSelection(
        String shopId,
        List<String> discountCodes,
        List<CheckoutProductSelection> products
) {
    public CheckoutShopSelection {
        discountCodes = List.copyOf(discountCodes);
        products = List.copyOf(products);
    }
}
