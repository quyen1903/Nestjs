package com.itechwx.ecommerce.checkout.application;

public interface CheckoutService {

    CheckoutReviewView review(String userId, CheckoutCommand command);

    CreateOrdersResult createOrders(String userId, String idempotencyKey, CheckoutCommand command);
}
