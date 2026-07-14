package com.itechwx.ecommerce.checkout.application;

import java.math.BigDecimal;

public record CheckoutProductView(
        String productId,
        String name,
        String shopId,
        int quantity,
        BigDecimal price
) {
}
