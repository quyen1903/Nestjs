package com.itechwx.ecommerce.cart.application;

public record CartItemView(
        String id,
        String productId,
        String shopId,
        int quantity,
        String name,
        long price
) {
}
