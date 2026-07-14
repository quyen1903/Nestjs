package com.itechwx.ecommerce.payment.application;

public record PaymentIntentView(
        String id,
        String status,
        long amount,
        long amountReceived,
        String currency,
        long created
) {
}
