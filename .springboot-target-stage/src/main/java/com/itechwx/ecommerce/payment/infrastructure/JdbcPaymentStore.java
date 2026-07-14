package com.itechwx.ecommerce.payment.infrastructure;

import com.itechwx.ecommerce.auth.domain.ActorPrincipal;
import com.itechwx.ecommerce.auth.domain.ActorType;
import com.itechwx.ecommerce.inventory.application.InventoryReservationService;
import com.itechwx.ecommerce.payment.application.GatewayPaymentIntent;
import com.itechwx.ecommerce.payment.application.GatewayRefund;
import com.itechwx.ecommerce.payment.application.VerifiedPaymentEvent;
import com.itechwx.ecommerce.payment.config.StripeProperties;
import com.itechwx.ecommerce.shared.error.ApplicationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class JdbcPaymentStore {

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final TransactionTemplate transactionTemplate;
    private final InventoryReservationService reservationService;
    private final StripeProperties properties;
    private final Clock clock;

    public JdbcPaymentStore(
            NamedParameterJdbcTemplate jdbcTemplate,
            TransactionTemplate transactionTemplate,
            InventoryReservationService reservationService,
            StripeProperties properties,
            Clock clock
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.transactionTemplate = transactionTemplate;
        this.reservationService = reservationService;
        this.properties = properties;
        this.clock = clock;
    }

    PaymentOrder prepareOrderForPayment(String userId, String orderId) {
        return transactionTemplate.execute(status -> {
            PaymentOrder order = orderForUpdate("id = :orderId AND user_id = :actorId",
                    orderId, userId);
            if (order == null) {
                throw notFound();
            }
            if (!"PENDING".equals(order.status())) {
                return order;
            }
            if (!order.expiresAt().isAfter(clock.instant())) {
                reservationService.releaseForOrder(order.id());
                cancelOrder(order.id(), "expired");
                return order.withStatus("CANCELLED");
            }
            return order;
        });
    }

    PaymentOrder requireOrderForPaymentIntent(ActorPrincipal actor, String paymentIntentId) {
        String predicate = actorPredicate(actor.actorType());
        List<PaymentOrder> rows = jdbcTemplate.query("""
                SELECT id, user_id, "shopBusinessId", status::text AS status,
                       total_price, payment_intent_id, expired_at
                  FROM orders
                 WHERE payment_intent_id = :paymentIntentId
                   AND is_active = true
                """ + predicate, new MapSqlParameterSource()
                .addValue("paymentIntentId", paymentIntentId)
                .addValue("actorId", actor.accountId()),
                (resultSet, rowNumber) -> mapOrder(resultSet));
        if (rows.isEmpty()) {
            throw notFound();
        }
        return rows.getFirst();
    }

    PaymentOrder requireRefundableOrder(ActorPrincipal actor, String paymentIntentId) {
        PaymentOrder order = requireOrderForPaymentIntent(actor, paymentIntentId);
        if (!"CONFIRMED".equals(order.status())) {
            throw new ApplicationException(
                    HttpStatus.CONFLICT,
                    "INVALID_ORDER_STATE",
                    "Only a confirmed order can be refunded."
            );
        }
        return order;
    }

    CustomerIdentity requireCustomerIdentity(String userId) {
        List<CustomerIdentity> rows = jdbcTemplate.query("""
                SELECT authentication.email, profile.name
                  FROM accounts account
                  JOIN account_authentication authentication
                    ON authentication."accountId" = account.id
                   AND authentication.is_active = true
                  LEFT JOIN account_profiles profile ON profile."accountId" = account.id
                 WHERE account.id = :userId
                   AND account.account_type = CAST('USER' AS "AccountType")
                   AND account.status = CAST('ACTIVE' AS "Status")
                   AND account.is_active = true
                """, new MapSqlParameterSource("userId", userId),
                (resultSet, rowNumber) -> new CustomerIdentity(
                        resultSet.getString("email"), resultSet.getString("name")
                ));
        if (rows.isEmpty()) {
            throw new ApplicationException(HttpStatus.NOT_FOUND, "ACCOUNT_NOT_FOUND", "Account not found.");
        }
        return rows.getFirst();
    }

    void attachPaymentIntent(String orderId, GatewayPaymentIntent intent) {
        transactionTemplate.executeWithoutResult(status -> {
            List<String> current = jdbcTemplate.query("""
                    SELECT payment_intent_id FROM orders WHERE id = :orderId FOR UPDATE
                    """, new MapSqlParameterSource("orderId", orderId),
                    (resultSet, rowNumber) -> resultSet.getString("payment_intent_id"));
            if (current.isEmpty()) {
                throw notFound();
            }
            if (current.getFirst() != null && !current.getFirst().equals(intent.id())) {
                throw new ApplicationException(
                        HttpStatus.CONFLICT,
                        "PAYMENT_INTENT_CONFLICT",
                        "The order already has a different payment intent."
                );
            }
            jdbcTemplate.update("""
                    UPDATE orders
                       SET payment_intent_id = :paymentIntentId,
                           payment_info = jsonb_set(
                               payment_info,
                               '{stripe}',
                               COALESCE(payment_info->'stripe', '{}'::jsonb)
                                   || jsonb_build_object(
                                       'provider', 'stripe',
                                       'paymentIntentId', :paymentIntentId,
                                       'status', :providerStatus,
                                       'amount', :amount,
                                       'currency', :currency
                                   ),
                               true
                           ),
                           updated_at = :now
                     WHERE id = :orderId
                    """, new MapSqlParameterSource()
                    .addValue("paymentIntentId", intent.id())
                    .addValue("providerStatus", intent.status())
                    .addValue("amount", intent.amount())
                    .addValue("currency", intent.currency())
                    .addValue("now", clock.millis())
                    .addValue("orderId", orderId));
        });
    }

    Operation claimOperation(
            String type,
            String idempotencyKey,
            String actorId,
            String orderId,
            String fingerprint,
            Long amountMinor
    ) {
        return transactionTemplate.execute(status -> {
            jdbcTemplate.query(
                    "SELECT pg_advisory_xact_lock(hashtextextended(:key, 0))",
                    new MapSqlParameterSource("key", type + ":" + idempotencyKey),
                    resultSet -> null
            );
            List<Operation> existing = jdbcTemplate.query("""
                    SELECT id, request_fingerprint, provider_object_id,
                           provider_status, status
                      FROM payment_operations
                     WHERE operation_type = :type AND idempotency_key = :key
                     FOR UPDATE
                    """, new MapSqlParameterSource()
                    .addValue("type", type)
                    .addValue("key", idempotencyKey), (resultSet, rowNumber) -> new Operation(
                    resultSet.getString("id"), resultSet.getString("request_fingerprint"),
                    resultSet.getString("provider_object_id"), resultSet.getString("provider_status"),
                    resultSet.getString("status")
            ));
            if (!existing.isEmpty()) {
                Operation operation = existing.getFirst();
                if (!operation.fingerprint().equals(fingerprint)) {
                    throw new ApplicationException(
                            HttpStatus.CONFLICT,
                            "IDEMPOTENCY_CONFLICT",
                            "The idempotency key was already used for a different payment operation."
                    );
                }
                return operation;
            }
            if ("REFUND".equals(type)) {
                validateRefundCapacity(orderId, amountMinor);
            }
            String id = UUID.randomUUID().toString();
            jdbcTemplate.update("""
                    INSERT INTO payment_operations(
                        id, operation_type, idempotency_key, actor_id, order_id,
                        request_fingerprint, amount_minor, status, created_at, updated_at
                    ) VALUES (
                        :id, :type, :key, :actorId, :orderId,
                        :fingerprint, :amountMinor, 'PROCESSING', :now, :now
                    )
                    """, new MapSqlParameterSource()
                    .addValue("id", id).addValue("type", type).addValue("key", idempotencyKey)
                    .addValue("actorId", actorId).addValue("orderId", orderId)
                    .addValue("fingerprint", fingerprint).addValue("amountMinor", amountMinor)
                    .addValue("now", clock.millis()));
            return new Operation(id, fingerprint, null, null, "PROCESSING");
        });
    }

    void completeOperation(Operation operation, String providerObjectId, String providerStatus) {
        jdbcTemplate.update("""
                UPDATE payment_operations
                   SET provider_object_id = :providerObjectId,
                       provider_status = :providerStatus,
                       status = 'COMPLETED', updated_at = :now
                 WHERE id = :id
                """, new MapSqlParameterSource()
                .addValue("providerObjectId", providerObjectId)
                .addValue("providerStatus", providerStatus)
                .addValue("now", clock.millis())
                .addValue("id", operation.id()));
    }

    void recordRefund(String orderId, GatewayRefund refund) {
        jdbcTemplate.update("""
                UPDATE orders
                   SET payment_info = jsonb_set(
                           payment_info,
                           '{stripe}',
                           COALESCE(payment_info->'stripe', '{}'::jsonb)
                               || jsonb_build_object(
                                   'lastRefundId', :refundId,
                                   'lastRefundStatus', :refundStatus
                               ),
                           true
                       ),
                       updated_at = :now
                 WHERE id = :orderId
                """, new MapSqlParameterSource()
                .addValue("refundId", refund.id())
                .addValue("refundStatus", refund.status())
                .addValue("now", clock.millis())
                .addValue("orderId", orderId));
    }

    WebhookDecision applyEvent(VerifiedPaymentEvent event) {
        return transactionTemplate.execute(status -> applyEventInTransaction(event));
    }

    private WebhookDecision applyEventInTransaction(VerifiedPaymentEvent event) {
        jdbcTemplate.query(
                "SELECT pg_advisory_xact_lock(hashtextextended(:key, 0))",
                new MapSqlParameterSource("key", "stripe-event:" + event.eventId()),
                resultSet -> null
        );
        List<PaymentEventRow> existing = jdbcTemplate.query("""
                SELECT status, payment_intent_id, failure_code
                  FROM payment_events WHERE event_id = :eventId FOR UPDATE
                """, new MapSqlParameterSource("eventId", event.eventId()),
                (resultSet, rowNumber) -> new PaymentEventRow(
                        resultSet.getString("status"),
                        resultSet.getString("payment_intent_id"),
                        resultSet.getString("failure_code")
                ));
        if (!existing.isEmpty()) {
            PaymentEventRow row = existing.getFirst();
            if ("COMPENSATION_PENDING".equals(row.status())) {
                return new WebhookDecision(
                        true, "COMPENSATION_PENDING", true,
                        event.eventId(), row.paymentIntentId()
                );
            }
            return new WebhookDecision(true, row.status(), false, event.eventId(), row.paymentIntentId());
        }
        jdbcTemplate.update("""
                INSERT INTO payment_events(
                    event_id, event_type, payment_intent_id, status, created_at, updated_at
                ) VALUES (
                    :eventId, :eventType, :paymentIntentId, 'RECEIVED', :now, :now
                )
                """, new MapSqlParameterSource()
                .addValue("eventId", event.eventId())
                .addValue("eventType", event.type())
                .addValue("paymentIntentId", event.paymentIntentId())
                .addValue("now", clock.millis()));

        if (!isHandled(event.type())) {
            updateEvent(event.eventId(), "IGNORED", null);
            return new WebhookDecision(false, "IGNORED", false, event.eventId(), null);
        }
        PaymentOrder order = orderByPaymentIntentForUpdate(event.paymentIntentId());
        if (order == null) {
            updateEvent(event.eventId(), "IGNORED", "ORDER_NOT_FOUND");
            return new WebhookDecision(false, "IGNORED", false, event.eventId(), event.paymentIntentId());
        }
        if ("payment_intent.succeeded".equals(event.type())) {
            return applySucceeded(event, order);
        }
        if ("PENDING".equals(order.status())) {
            reservationService.releaseForOrder(order.id());
            cancelOrder(order.id(), event.paymentStatus());
        }
        updateEvent(event.eventId(), "PROCESSED", null);
        return new WebhookDecision(false, "PROCESSED", false, event.eventId(), event.paymentIntentId());
    }

    private WebhookDecision applySucceeded(VerifiedPaymentEvent event, PaymentOrder order) {
        if ("CONFIRMED".equals(order.status())) {
            updateEvent(event.eventId(), "PROCESSED", null);
            return new WebhookDecision(false, "PROCESSED", false, event.eventId(), event.paymentIntentId());
        }
        if (!"PENDING".equals(order.status())) {
            updateEvent(event.eventId(), "COMPENSATION_PENDING", "INVALID_ORDER_STATE");
            return new WebhookDecision(
                    false, "COMPENSATION_PENDING", true, event.eventId(), event.paymentIntentId()
            );
        }
        long received = event.amountReceived() > 0 ? event.amountReceived() : event.amount();
        if (received != minorUnits(order.totalPrice())
                || event.currency() == null
                || !properties.currency().equalsIgnoreCase(event.currency())) {
            reservationService.releaseForOrder(order.id());
            cancelOrder(order.id(), "payment_mismatch");
            updateEvent(event.eventId(), "COMPENSATION_PENDING", "PAYMENT_MISMATCH");
            return new WebhookDecision(
                    false, "COMPENSATION_PENDING", true, event.eventId(), event.paymentIntentId()
            );
        }
        if (!reservationService.consumeForOrder(order.id())) {
            reservationService.releaseForOrder(order.id());
            cancelOrder(order.id(), "reservation_unavailable");
            updateEvent(event.eventId(), "COMPENSATION_PENDING", "RESERVATION_UNAVAILABLE");
            return new WebhookDecision(
                    false, "COMPENSATION_PENDING", true, event.eventId(), event.paymentIntentId()
            );
        }
        jdbcTemplate.update("""
                UPDATE orders
                   SET status = CAST('CONFIRMED' AS "OrderStatus"),
                       payment_info = jsonb_set(
                           payment_info,
                           '{stripe}',
                           COALESCE(payment_info->'stripe', '{}'::jsonb)
                               || jsonb_build_object(
                                   'status', :providerStatus,
                                   'eventId', :eventId
                               ),
                           true
                       ),
                       updated_at = :now
                 WHERE id = :orderId AND status = CAST('PENDING' AS "OrderStatus")
                """, new MapSqlParameterSource()
                .addValue("providerStatus", event.paymentStatus())
                .addValue("eventId", event.eventId())
                .addValue("now", clock.millis())
                .addValue("orderId", order.id()));
        updateEvent(event.eventId(), "PROCESSED", null);
        return new WebhookDecision(false, "PROCESSED", false, event.eventId(), event.paymentIntentId());
    }

    void completeCompensation(String eventId, String paymentIntentId, GatewayRefund refund) {
        transactionTemplate.executeWithoutResult(status -> {
            jdbcTemplate.update("""
                    UPDATE payment_events
                       SET status = 'COMPENSATED', failure_code = NULL, updated_at = :now
                     WHERE event_id = :eventId AND status = 'COMPENSATION_PENDING'
                    """, new MapSqlParameterSource()
                    .addValue("now", clock.millis())
                    .addValue("eventId", eventId));
            jdbcTemplate.update("""
                    UPDATE orders
                       SET payment_info = jsonb_set(
                           payment_info,
                           '{stripe}',
                           COALESCE(payment_info->'stripe', '{}'::jsonb)
                               || jsonb_build_object(
                                   'compensationRefundId', :refundId,
                                   'compensationRefundStatus', :refundStatus,
                                   'compensatedEventId', :eventId
                               ),
                           true
                       ),
                       updated_at = :now
                     WHERE payment_intent_id = :paymentIntentId
                    """, new MapSqlParameterSource()
                    .addValue("refundId", refund.id())
                    .addValue("refundStatus", refund.status())
                    .addValue("eventId", eventId)
                    .addValue("now", clock.millis())
                    .addValue("paymentIntentId", paymentIntentId));
        });
    }

    private PaymentOrder orderForUpdate(String predicate, String orderId, String actorId) {
        List<PaymentOrder> rows = jdbcTemplate.query("""
                SELECT id, user_id, "shopBusinessId", status::text AS status,
                       total_price, payment_intent_id, expired_at
                  FROM orders
                 WHERE is_active = true AND
                """ + predicate + " FOR UPDATE", new MapSqlParameterSource()
                .addValue("orderId", orderId).addValue("actorId", actorId),
                (resultSet, rowNumber) -> mapOrder(resultSet));
        return rows.isEmpty() ? null : rows.getFirst();
    }

    private PaymentOrder orderByPaymentIntentForUpdate(String paymentIntentId) {
        List<PaymentOrder> rows = jdbcTemplate.query("""
                SELECT id, user_id, "shopBusinessId", status::text AS status,
                       total_price, payment_intent_id, expired_at
                  FROM orders
                 WHERE payment_intent_id = :paymentIntentId AND is_active = true
                 FOR UPDATE
                """, new MapSqlParameterSource("paymentIntentId", paymentIntentId),
                (resultSet, rowNumber) -> mapOrder(resultSet));
        return rows.isEmpty() ? null : rows.getFirst();
    }

    private PaymentOrder mapOrder(java.sql.ResultSet resultSet) throws java.sql.SQLException {
        return new PaymentOrder(
                resultSet.getString("id"), resultSet.getString("user_id"),
                resultSet.getString("shopBusinessId"), resultSet.getString("status"),
                resultSet.getBigDecimal("total_price").setScale(2, RoundingMode.HALF_UP),
                resultSet.getString("payment_intent_id"),
                resultSet.getTimestamp("expired_at").toInstant()
        );
    }

    private String actorPredicate(ActorType actorType) {
        return switch (actorType) {
            case USER -> " AND user_id = :actorId";
            case SHOP -> " AND \"shopBusinessId\" = :actorId";
            case ADMIN, SUPER_ADMIN -> "";
        };
    }

    private void cancelOrder(String orderId, String providerStatus) {
        jdbcTemplate.update("""
                UPDATE orders
                   SET status = CAST('CANCELLED' AS "OrderStatus"),
                       payment_info = jsonb_set(
                           payment_info,
                           '{stripe}',
                           COALESCE(payment_info->'stripe', '{}'::jsonb)
                               || jsonb_build_object('status', :providerStatus),
                           true
                       ),
                       updated_at = :now
                 WHERE id = :orderId AND status = CAST('PENDING' AS "OrderStatus")
                """, new MapSqlParameterSource()
                .addValue("providerStatus", providerStatus == null ? "failed" : providerStatus)
                .addValue("now", clock.millis())
                .addValue("orderId", orderId));
    }

    private void updateEvent(String eventId, String status, String failureCode) {
        jdbcTemplate.update("""
                UPDATE payment_events
                   SET status = :status, failure_code = :failureCode, updated_at = :now
                 WHERE event_id = :eventId
                """, new MapSqlParameterSource()
                .addValue("status", status)
                .addValue("failureCode", failureCode)
                .addValue("now", clock.millis())
                .addValue("eventId", eventId));
    }

    private void validateRefundCapacity(String orderId, Long amountMinor) {
        if (orderId == null || amountMinor == null || amountMinor <= 0) {
            throw new ApplicationException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_REFUND_AMOUNT",
                    "Refund amount must be positive."
            );
        }
        List<PaymentOrder> orders = jdbcTemplate.query("""
                SELECT id, user_id, "shopBusinessId", status::text AS status,
                       total_price, payment_intent_id, expired_at
                  FROM orders WHERE id = :orderId AND is_active = true FOR UPDATE
                """, new MapSqlParameterSource("orderId", orderId),
                (resultSet, rowNumber) -> mapOrder(resultSet));
        if (orders.isEmpty()) {
            throw notFound();
        }
        if (!"CONFIRMED".equals(orders.getFirst().status())) {
            throw new ApplicationException(
                    HttpStatus.CONFLICT,
                    "INVALID_ORDER_STATE",
                    "Only a confirmed order can be refunded."
            );
        }
        Long reserved = jdbcTemplate.queryForObject("""
                SELECT COALESCE(sum(amount_minor), 0)
                  FROM payment_operations
                 WHERE order_id = :orderId AND operation_type = 'REFUND'
                   AND status IN ('PROCESSING', 'COMPLETED')
                """, new MapSqlParameterSource("orderId", orderId), Long.class);
        long total = minorUnits(orders.getFirst().totalPrice());
        if (reserved == null || amountMinor > total - reserved) {
            throw new ApplicationException(
                    HttpStatus.CONFLICT,
                    "REFUND_LIMIT_EXCEEDED",
                    "Refund amount exceeds the unrefunded order balance."
            );
        }
    }

    private boolean isHandled(String type) {
        return "payment_intent.succeeded".equals(type)
                || "payment_intent.payment_failed".equals(type)
                || "payment_intent.canceled".equals(type);
    }

    private long minorUnits(BigDecimal value) {
        try {
            return value.setScale(2, RoundingMode.UNNECESSARY).movePointRight(2).longValueExact();
        } catch (ArithmeticException exception) {
            throw new ApplicationException(
                    HttpStatus.CONFLICT,
                    "INVALID_ORDER_TOTAL",
                    "The order total cannot be represented in payment minor units."
            );
        }
    }

    private ApplicationException notFound() {
        return new ApplicationException(
                HttpStatus.NOT_FOUND,
                "PAYMENT_NOT_FOUND",
                "Payment not found or access denied."
        );
    }

    record PaymentOrder(
            String id,
            String userId,
            String shopId,
            String status,
            BigDecimal totalPrice,
            String paymentIntentId,
            Instant expiresAt
    ) {
        PaymentOrder withStatus(String newStatus) {
            return new PaymentOrder(id, userId, shopId, newStatus, totalPrice, paymentIntentId, expiresAt);
        }
    }

    record CustomerIdentity(String email, String name) {
    }

    record Operation(
            String id,
            String fingerprint,
            String providerObjectId,
            String providerStatus,
            String status
    ) {
        boolean completed() {
            return "COMPLETED".equals(status);
        }
    }

    record WebhookDecision(
            boolean replayed,
            String outcome,
            boolean needsCompensation,
            String eventId,
            String paymentIntentId
    ) {
    }

    private record PaymentEventRow(String status, String paymentIntentId, String failureCode) {
    }
}
