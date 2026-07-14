package com.itechwx.ecommerce.payment.application;

public interface PaymentGateway {

    GatewayPaymentIntent createPaymentIntent(
            String orderId,
            long amount,
            String currency,
            String description,
            String idempotencyKey
    );

    GatewayPaymentIntent retrievePaymentIntent(String paymentIntentId);

    GatewayRefund refund(
            String paymentIntentId,
            Long amount,
            String reason,
            String idempotencyKey
    );

    String createCustomer(String userId, String email, String name, String idempotencyKey);

    VerifiedPaymentEvent verifyWebhook(String signature, byte[] rawBody);
}
