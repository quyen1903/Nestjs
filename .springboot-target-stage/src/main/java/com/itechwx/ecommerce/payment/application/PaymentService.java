package com.itechwx.ecommerce.payment.application;

import com.itechwx.ecommerce.auth.domain.ActorPrincipal;

public interface PaymentService {

    CreatePaymentResult createPayment(String userId, CreatePaymentCommand command);

    PaymentIntentView getPayment(ActorPrincipal actor, String paymentIntentId);

    RefundPaymentResult refund(
            ActorPrincipal actor,
            String idempotencyKey,
            RefundPaymentCommand command
    );

    CustomerResult createCustomer(String userId);

    WebhookResult handleWebhook(String signature, byte[] rawBody);
}
