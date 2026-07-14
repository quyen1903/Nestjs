package com.itechwx.ecommerce.payment.infrastructure;

import com.itechwx.ecommerce.auth.domain.ActorPrincipal;
import com.itechwx.ecommerce.payment.application.CreatePaymentCommand;
import com.itechwx.ecommerce.payment.application.CreatePaymentResult;
import com.itechwx.ecommerce.payment.application.CustomerResult;
import com.itechwx.ecommerce.payment.application.GatewayPaymentIntent;
import com.itechwx.ecommerce.payment.application.GatewayRefund;
import com.itechwx.ecommerce.payment.application.PaymentGateway;
import com.itechwx.ecommerce.payment.application.PaymentIntentView;
import com.itechwx.ecommerce.payment.application.PaymentService;
import com.itechwx.ecommerce.payment.application.RefundPaymentCommand;
import com.itechwx.ecommerce.payment.application.RefundPaymentResult;
import com.itechwx.ecommerce.payment.application.VerifiedPaymentEvent;
import com.itechwx.ecommerce.payment.application.WebhookResult;
import com.itechwx.ecommerce.payment.config.StripeProperties;
import com.itechwx.ecommerce.shared.error.ApplicationException;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Locale;
import java.util.regex.Pattern;

public final class DefaultPaymentService implements PaymentService {

    private static final Pattern IDEMPOTENCY_KEY = Pattern.compile("[\\x21-\\x7E]{1,255}");

    private final PaymentGateway gateway;
    private final JdbcPaymentStore store;
    private final StripeProperties properties;

    public DefaultPaymentService(
            PaymentGateway gateway,
            JdbcPaymentStore store,
            StripeProperties properties
    ) {
        this.gateway = gateway;
        this.store = store;
        this.properties = properties;
    }

    @Override
    public CreatePaymentResult createPayment(String userId, CreatePaymentCommand command) {
        JdbcPaymentStore.PaymentOrder order = store.prepareOrderForPayment(userId, command.orderId());
        if (!"PENDING".equals(order.status())) {
            throw new ApplicationException(
                    HttpStatus.CONFLICT,
                    "INVALID_ORDER_STATE",
                    "Only a pending, unexpired order can create a payment intent."
            );
        }
        long amount = minorUnits(order.totalPrice());
        if (amount <= 0) {
            throw new ApplicationException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_ORDER_TOTAL",
                    "The order total is invalid."
            );
        }
        String providerKey = "payment-intent:" + order.id();
        String fingerprint = hash(order.id() + ":" + amount + ":" + properties.currency());
        JdbcPaymentStore.Operation operation = store.claimOperation(
                "CREATE_INTENT", providerKey, userId, order.id(), fingerprint, amount
        );
        GatewayPaymentIntent intent;
        if (operation.completed()) {
            intent = gateway.retrievePaymentIntent(requireProviderObject(operation));
        } else if (order.paymentIntentId() != null) {
            intent = gateway.retrievePaymentIntent(order.paymentIntentId());
        } else {
            intent = gateway.createPaymentIntent(
                    order.id(), amount, properties.currency(), command.description(), providerKey
            );
        }
        if (intent.amount() != amount || !properties.currency().equalsIgnoreCase(intent.currency())) {
            throw new ApplicationException(
                    HttpStatus.CONFLICT,
                    "PAYMENT_INTENT_MISMATCH",
                    "The payment intent does not match the order."
            );
        }
        store.attachPaymentIntent(order.id(), intent);
        store.completeOperation(operation, intent.id(), intent.status());
        return new CreatePaymentResult(true, intent.clientSecret(), intent.id(), intent.status());
    }

    @Override
    public PaymentIntentView getPayment(ActorPrincipal actor, String paymentIntentId) {
        store.requireOrderForPaymentIntent(actor, paymentIntentId);
        GatewayPaymentIntent intent = gateway.retrievePaymentIntent(paymentIntentId);
        return view(intent);
    }

    @Override
    public RefundPaymentResult refund(
            ActorPrincipal actor,
            String suppliedIdempotencyKey,
            RefundPaymentCommand command
    ) {
        String clientKey = requireIdempotencyKey(suppliedIdempotencyKey);
        JdbcPaymentStore.PaymentOrder order = store.requireRefundableOrder(actor, command.paymentIntentId());
        Long amount = command.amount() == null ? null : minorUnits(command.amount());
        if (amount != null && (amount <= 0 || amount > minorUnits(order.totalPrice()))) {
            throw new ApplicationException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_REFUND_AMOUNT",
                    "Refund amount must be positive and no greater than the order total."
            );
        }
        String reason = normalizeReason(command.reason());
        String fingerprint = hash(command.paymentIntentId() + ":" + amount + ":" + reason);
        String providerKey = "refund:" + hash(actor.accountId() + ":" + clientKey);
        JdbcPaymentStore.Operation operation = store.claimOperation(
                "REFUND", providerKey, actor.accountId(), order.id(), fingerprint,
                amount == null ? minorUnits(order.totalPrice()) : amount
        );
        GatewayRefund refund = operation.completed()
                ? new GatewayRefund(requireProviderObject(operation), operation.providerStatus())
                : gateway.refund(command.paymentIntentId(), amount, reason, providerKey);
        store.completeOperation(operation, refund.id(), refund.status());
        store.recordRefund(order.id(), refund);
        return new RefundPaymentResult(true, refund.id(), refund.status());
    }

    @Override
    public CustomerResult createCustomer(String userId) {
        JdbcPaymentStore.CustomerIdentity identity = store.requireCustomerIdentity(userId);
        String fingerprint = hash(userId + ":" + identity.email() + ":" + identity.name());
        String providerKey = "customer:" + userId;
        JdbcPaymentStore.Operation operation = store.claimOperation(
                "CREATE_CUSTOMER", providerKey, userId, null, fingerprint, null
        );
        String customerId = operation.completed()
                ? requireProviderObject(operation)
                : gateway.createCustomer(userId, identity.email(), identity.name(), providerKey);
        store.completeOperation(operation, customerId, "created");
        return new CustomerResult(true, customerId);
    }

    @Override
    public WebhookResult handleWebhook(String signature, byte[] rawBody) {
        VerifiedPaymentEvent event = gateway.verifyWebhook(signature, rawBody);
        JdbcPaymentStore.WebhookDecision decision = store.applyEvent(event);
        if (!decision.needsCompensation()) {
            return new WebhookResult(true, decision.replayed(), decision.outcome());
        }
        String fingerprint = hash(decision.eventId() + ":" + decision.paymentIntentId());
        String providerKey = "compensation:" + decision.eventId();
        JdbcPaymentStore.Operation operation = store.claimOperation(
                "COMPENSATION_REFUND", providerKey, "SYSTEM", null, fingerprint, null
        );
        GatewayRefund refund = operation.completed()
                ? new GatewayRefund(requireProviderObject(operation), operation.providerStatus())
                : gateway.refund(decision.paymentIntentId(), null, null, providerKey);
        store.completeOperation(operation, refund.id(), refund.status());
        store.completeCompensation(
                decision.eventId(), decision.paymentIntentId(), refund
        );
        return new WebhookResult(true, decision.replayed(), "COMPENSATED");
    }

    private PaymentIntentView view(GatewayPaymentIntent intent) {
        return new PaymentIntentView(
                intent.id(), intent.status(), intent.amount(), intent.amountReceived(),
                intent.currency(), intent.created()
        );
    }

    private long minorUnits(BigDecimal value) {
        try {
            return value.setScale(2, RoundingMode.UNNECESSARY).movePointRight(2).longValueExact();
        } catch (ArithmeticException exception) {
            throw new ApplicationException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_MONEY",
                    "The amount cannot be represented in payment minor units."
            );
        }
    }

    private String normalizeReason(String reason) {
        if (reason == null || reason.isBlank()) {
            return null;
        }
        String normalized = reason.trim().toLowerCase(Locale.ROOT);
        if (!normalized.equals("duplicate")
                && !normalized.equals("fraudulent")
                && !normalized.equals("requested_by_customer")) {
            throw new ApplicationException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_REFUND_REASON",
                    "Refund reason is invalid."
            );
        }
        return normalized;
    }

    private String requireIdempotencyKey(String key) {
        if (key == null || !IDEMPOTENCY_KEY.matcher(key.trim()).matches()) {
            throw new ApplicationException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_IDEMPOTENCY_KEY",
                    "A visible ASCII Idempotency-Key of at most 255 characters is required."
            );
        }
        return key.trim();
    }

    private String requireProviderObject(JdbcPaymentStore.Operation operation) {
        if (operation.providerObjectId() == null || operation.providerObjectId().isBlank()) {
            throw new ApplicationException(
                    HttpStatus.CONFLICT,
                    "PAYMENT_OPERATION_INCOMPLETE",
                    "The payment operation is incomplete."
            );
        }
        return operation.providerObjectId();
    }

    private String hash(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(String.valueOf(value).getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}
