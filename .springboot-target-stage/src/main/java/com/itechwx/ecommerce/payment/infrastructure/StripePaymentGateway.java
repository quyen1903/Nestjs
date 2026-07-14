package com.itechwx.ecommerce.payment.infrastructure;

import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Customer;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Refund;
import com.stripe.net.RequestOptions;
import com.stripe.net.Webhook;
import com.stripe.param.CustomerCreateParams;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.RefundCreateParams;
import com.itechwx.ecommerce.payment.application.GatewayPaymentIntent;
import com.itechwx.ecommerce.payment.application.GatewayRefund;
import com.itechwx.ecommerce.payment.application.PaymentGateway;
import com.itechwx.ecommerce.payment.application.VerifiedPaymentEvent;
import com.itechwx.ecommerce.payment.config.StripeProperties;
import com.itechwx.ecommerce.shared.error.ApplicationException;
import org.springframework.http.HttpStatus;

import java.nio.charset.StandardCharsets;

public final class StripePaymentGateway implements PaymentGateway {

    private final String secretKey;
    private final String webhookSecret;

    public StripePaymentGateway(StripeProperties properties) {
        this.secretKey = properties.secretKey();
        this.webhookSecret = properties.webhookSecret();
    }

    @Override
    public GatewayPaymentIntent createPaymentIntent(
            String orderId,
            long amount,
            String currency,
            String description,
            String idempotencyKey
    ) {
        PaymentIntentCreateParams.Builder builder = PaymentIntentCreateParams.builder()
                .setAmount(amount)
                .setCurrency(currency)
                .setAutomaticPaymentMethods(PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                        .setEnabled(true)
                        .build())
                .putMetadata("source", "ecommerce-api")
                .putMetadata("orderId", orderId);
        if (description != null && !description.isBlank()) {
            builder.setDescription(description.trim());
        }
        try {
            return paymentIntent(PaymentIntent.create(builder.build(), options(idempotencyKey)));
        } catch (StripeException exception) {
            throw downstream();
        }
    }

    @Override
    public GatewayPaymentIntent retrievePaymentIntent(String paymentIntentId) {
        try {
            return paymentIntent(PaymentIntent.retrieve(paymentIntentId, options(null)));
        } catch (StripeException exception) {
            throw downstream();
        }
    }

    @Override
    public GatewayRefund refund(
            String paymentIntentId,
            Long amount,
            String reason,
            String idempotencyKey
    ) {
        RefundCreateParams.Builder builder = RefundCreateParams.builder()
                .setPaymentIntent(paymentIntentId);
        if (amount != null) {
            builder.setAmount(amount);
        }
        if (reason != null && !reason.isBlank()) {
            builder.setReason(switch (reason) {
                case "duplicate" -> RefundCreateParams.Reason.DUPLICATE;
                case "fraudulent" -> RefundCreateParams.Reason.FRAUDULENT;
                case "requested_by_customer" -> RefundCreateParams.Reason.REQUESTED_BY_CUSTOMER;
                default -> throw new ApplicationException(
                        HttpStatus.BAD_REQUEST,
                        "INVALID_REFUND_REASON",
                        "Refund reason is invalid."
                );
            });
        }
        try {
            Refund refund = Refund.create(builder.build(), options(idempotencyKey));
            return new GatewayRefund(refund.getId(), refund.getStatus());
        } catch (StripeException exception) {
            throw downstream();
        }
    }

    @Override
    public String createCustomer(
            String userId,
            String email,
            String name,
            String idempotencyKey
    ) {
        CustomerCreateParams.Builder builder = CustomerCreateParams.builder()
                .setEmail(email)
                .putMetadata("source", "ecommerce-api")
                .putMetadata("userId", userId);
        if (name != null && !name.isBlank()) {
            builder.setName(name.trim());
        }
        try {
            Customer customer = Customer.create(builder.build(), options(idempotencyKey));
            return customer.getId();
        } catch (StripeException exception) {
            throw downstream();
        }
    }

    @Override
    public VerifiedPaymentEvent verifyWebhook(String signature, byte[] rawBody) {
        if (signature == null || signature.isBlank() || rawBody == null || rawBody.length == 0) {
            throw new ApplicationException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_WEBHOOK_SIGNATURE",
                    "The webhook signature is invalid."
            );
        }
        try {
            Event event = Webhook.constructEvent(
                    new String(rawBody, StandardCharsets.UTF_8),
                    signature,
                    webhookSecret
            );
            if (!isPaymentIntentEvent(event.getType())) {
                return new VerifiedPaymentEvent(event.getId(), event.getType(), null, 0, 0, null, null);
            }
            Object object = event.getDataObjectDeserializer().getObject().orElseThrow();
            if (!(object instanceof PaymentIntent paymentIntent)) {
                throw new ApplicationException(
                        HttpStatus.BAD_REQUEST,
                        "INVALID_WEBHOOK_PAYLOAD",
                        "The webhook payload is invalid."
                );
            }
            return new VerifiedPaymentEvent(
                    event.getId(),
                    event.getType(),
                    paymentIntent.getId(),
                    value(paymentIntent.getAmount()),
                    value(paymentIntent.getAmountReceived()),
                    paymentIntent.getCurrency(),
                    paymentIntent.getStatus()
            );
        } catch (SignatureVerificationException exception) {
            throw new ApplicationException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_WEBHOOK_SIGNATURE",
                    "The webhook signature is invalid."
            );
        } catch (ApplicationException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            throw new ApplicationException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_WEBHOOK_PAYLOAD",
                    "The webhook payload is invalid."
            );
        }
    }

    private RequestOptions options(String idempotencyKey) {
        RequestOptions.RequestOptionsBuilder builder = RequestOptions.builder()
                .setApiKey(secretKey)
                .setMaxNetworkRetries(2);
        if (idempotencyKey != null) {
            builder.setIdempotencyKey(idempotencyKey);
        }
        return builder.build();
    }

    private GatewayPaymentIntent paymentIntent(PaymentIntent intent) {
        return new GatewayPaymentIntent(
                intent.getId(), intent.getClientSecret(), intent.getStatus(),
                value(intent.getAmount()), value(intent.getAmountReceived()),
                intent.getCurrency(), value(intent.getCreated())
        );
    }

    private boolean isPaymentIntentEvent(String eventType) {
        return "payment_intent.succeeded".equals(eventType)
                || "payment_intent.payment_failed".equals(eventType)
                || "payment_intent.canceled".equals(eventType);
    }

    private long value(Long value) {
        return value == null ? 0 : value;
    }

    private ApplicationException downstream() {
        return new ApplicationException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "DOWNSTREAM_UNAVAILABLE",
                "The payment provider is unavailable."
        );
    }
}
