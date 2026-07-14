package com.itechwx.ecommerce.payment.application;

public record GatewayPaymentIntent(
        String id,
        String clientSecret,
        String status,
        long amount,
        long amountReceived,
        String currency,
        long created
) {
}
