package com.itechwx.ecommerce.payment.infrastructure;

import com.itechwx.ecommerce.payment.application.GatewayPaymentIntent;
import com.itechwx.ecommerce.payment.application.GatewayRefund;
import com.itechwx.ecommerce.payment.application.PaymentGateway;
import com.itechwx.ecommerce.payment.application.VerifiedPaymentEvent;
import com.itechwx.ecommerce.shared.error.ApplicationException;
import org.springframework.http.HttpStatus;

public final class UnavailablePaymentGateway implements PaymentGateway {

    private ApplicationException unavailable() {
        return new ApplicationException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "PAYMENT_PROVIDER_UNAVAILABLE",
                "The payment provider is unavailable."
        );
    }

    @Override
    public GatewayPaymentIntent createPaymentIntent(
            String orderId, long amount, String currency, String description, String idempotencyKey
    ) {
        throw unavailable();
    }

    @Override
    public GatewayPaymentIntent retrievePaymentIntent(String paymentIntentId) {
        throw unavailable();
    }

    @Override
    public GatewayRefund refund(
            String paymentIntentId, Long amount, String reason, String idempotencyKey
    ) {
        throw unavailable();
    }

    @Override
    public String createCustomer(
            String userId, String email, String name, String idempotencyKey
    ) {
        throw unavailable();
    }

    @Override
    public VerifiedPaymentEvent verifyWebhook(String signature, byte[] rawBody) {
        throw unavailable();
    }
}
