package com.itechwx.ecommerce.checkout.application;

import java.math.BigDecimal;
import java.util.List;

public record ShopCheckoutView(
        String shopId,
        List<String> shopDiscounts,
        BigDecimal priceRaw,
        BigDecimal priceApplyDiscount,
        List<CheckoutProductView> itemProducts
) {
    public ShopCheckoutView {
        shopDiscounts = List.copyOf(shopDiscounts);
        itemProducts = List.copyOf(itemProducts);
    }
}
