package com.itechwx.ecommerce.checkout.application;

import java.util.List;

public record CheckoutReviewView(
        List<ShopCheckoutView> shopOrderIds,
        List<ShopCheckoutView> reviewedOrders,
        CheckoutTotals checkoutOrder
) {
    public CheckoutReviewView {
        shopOrderIds = List.copyOf(shopOrderIds);
        reviewedOrders = List.copyOf(reviewedOrders);
    }
}
