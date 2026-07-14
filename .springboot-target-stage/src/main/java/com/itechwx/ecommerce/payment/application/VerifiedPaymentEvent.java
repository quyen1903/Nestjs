package com.itechwx.ecommerce.payment.application;

public record VerifiedPaymentEvent(
        String eventId,
        String type,
        String paymentIntentId,
        long amount,
        long amountReceived,
        String currency,
        String paymentStatus
) {
}
