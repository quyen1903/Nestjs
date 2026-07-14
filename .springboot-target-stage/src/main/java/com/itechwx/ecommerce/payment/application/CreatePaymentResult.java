package com.itechwx.ecommerce.payment.application;

public record CreatePaymentResult(
        boolean success,
        String clientSecret,
        String paymentIntentId,
        String status
) {
}
