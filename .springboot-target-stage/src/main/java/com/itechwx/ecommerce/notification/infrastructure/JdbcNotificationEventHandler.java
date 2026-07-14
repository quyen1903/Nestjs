package com.itechwx.ecommerce.notification.infrastructure;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.itechwx.ecommerce.eventing.infrastructure.JdbcDomainEventOutbox;
import com.itechwx.ecommerce.notification.application.NotificationEventHandler;
import com.itechwx.ecommerce.notification.application.NotificationProcessingResult;
import com.itechwx.ecommerce.shared.error.ApplicationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

public final class JdbcNotificationEventHandler implements NotificationEventHandler {

    private static final int MAX_EVENT_BYTES = 16_384;

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final TransactionTemplate transactionTemplate;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    public JdbcNotificationEventHandler(
            NamedParameterJdbcTemplate jdbcTemplate,
            TransactionTemplate transactionTemplate,
            ObjectMapper objectMapper,
            Clock clock
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.transactionTemplate = transactionTemplate;
        this.objectMapper = objectMapper;
        this.clock = clock;
    }

    @Override
    public NotificationProcessingResult handle(String eventId, String topic, String rawPayload) {
        validateEnvelope(eventId, topic, rawPayload);
        JsonNode payload = parse(rawPayload);
        String payloadHash = sha256(topic + "\n" + rawPayload);
        return transactionTemplate.execute(status -> process(eventId, topic, payloadHash, payload));
    }

    private NotificationProcessingResult process(
            String eventId,
            String topic,
            String payloadHash,
            JsonNode payload
    ) {
        int inserted = jdbcTemplate.update("""
                INSERT INTO notification_event_receipts(
                    event_id, event_topic, payload_sha256, notification_count,
                    status, created_at, updated_at
                ) VALUES (
                    :eventId, :topic, :payloadHash, 0, 'PROCESSING', :now, :now
                )
                ON CONFLICT (event_id) DO NOTHING
                """, new MapSqlParameterSource()
                .addValue("eventId", eventId)
                .addValue("topic", topic)
                .addValue("payloadHash", payloadHash)
                .addValue("now", clock.millis()));
        if (inserted == 0) {
            EventReceipt receipt = receipt(eventId);
            if (!receipt.topic().equals(topic) || !receipt.payloadHash().equals(payloadHash)) {
                throw new ApplicationException(
                        HttpStatus.CONFLICT,
                        "EVENT_ID_COLLISION",
                        "The event identifier was already used for a different payload."
                );
            }
            return new NotificationProcessingResult(receipt.notificationCount(), true);
        }

        NotificationDefinition definition = switch (topic) {
            case JdbcDomainEventOutbox.PRODUCT_TOPIC -> productDefinition(payload);
            case JdbcDomainEventOutbox.DISCOUNT_TOPIC -> discountDefinition(payload);
            default -> throw invalidEvent("Unsupported notification event topic.");
        };
        List<String> threadIds = jdbcTemplate.query("""
                SELECT thread.id
                  FROM notification_threads thread
                  JOIN accounts account ON account.id = thread.noti_thread_user_id
                 WHERE thread.is_active = true
                   AND account.is_active = true
                   AND account.status = CAST('ACTIVE' AS "Status")
                   AND account.account_type = CAST('USER' AS "AccountType")
                 ORDER BY thread.id
                """, (resultSet, rowNumber) -> resultSet.getString(1));
        String options;
        try {
            options = objectMapper.writeValueAsString(java.util.Map.of(
                    "eventId", eventId,
                    "schemaVersion", 1
            ));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to serialize notification options", exception);
        }
        for (String threadId : threadIds) {
            jdbcTemplate.update("""
                    INSERT INTO notifications(
                        id, noti_type, noti_sender_id, noti_thread_id,
                        noti_content, noti_option, notification_status,
                        noti_product_id, noti_discount_id,
                        is_active, created_at, updated_at
                    ) VALUES (
                        :id, CAST(:type AS "NotificationType"), :senderId, :threadId,
                        :content, CAST(:options AS jsonb), 'unread',
                        :productId, :discountId, true, :now, :now
                    )
                    """, new MapSqlParameterSource()
                    .addValue("id", UUID.nameUUIDFromBytes(
                            (eventId + "\n" + threadId).getBytes(StandardCharsets.UTF_8)).toString())
                    .addValue("type", definition.type())
                    .addValue("senderId", definition.senderId())
                    .addValue("threadId", threadId)
                    .addValue("content", definition.content())
                    .addValue("options", options)
                    .addValue("productId", definition.productId())
                    .addValue("discountId", definition.discountId())
                    .addValue("now", clock.millis()));
        }
        jdbcTemplate.update("""
                UPDATE notification_event_receipts
                   SET notification_count = :count, status = 'PROCESSED', updated_at = :now
                 WHERE event_id = :eventId AND status = 'PROCESSING'
                """, new MapSqlParameterSource()
                .addValue("count", threadIds.size())
                .addValue("now", clock.millis())
                .addValue("eventId", eventId));
        return new NotificationProcessingResult(threadIds.size(), false);
    }

    private NotificationDefinition productDefinition(JsonNode payload) {
        String productId = optionalText(payload, "productId");
        String skuId = optionalText(payload, "skuId");
        if (productId == null && skuId == null) {
            throw invalidEvent("A product-created event requires productId or legacy skuId.");
        }
        String predicate = productId != null ? " product.id = :targetId" : " sku.id = :targetId";
        List<ProductSource> products = jdbcTemplate.query("""
                SELECT product.id, product.name, product."shopBusinessId" AS shop_id,
                       COALESCE(profile.name, 'Shop') AS shop_name
                  FROM "Spu" product
                  LEFT JOIN "Sku" sku ON sku."spuId" = product.id
                  JOIN accounts shop ON shop.id = product."shopBusinessId"
                  LEFT JOIN account_profiles profile ON profile."accountId" = shop.id
                 WHERE 1 = 1
                   AND """ + predicate + """
                   AND product.is_active = true
                   AND shop.is_active = true
                   AND shop.status = CAST('ACTIVE' AS "Status")
                   AND shop.account_type = CAST('SHOP' AS "AccountType")
                 LIMIT 1
                """, new MapSqlParameterSource("targetId", productId != null ? productId : skuId),
                (resultSet, rowNumber) -> new ProductSource(
                        resultSet.getString("id"),
                        resultSet.getString("name"),
                        resultSet.getString("shop_id"),
                        resultSet.getString("shop_name")
                ));
        if (products.isEmpty()) {
            throw invalidEvent("The product-created event target does not exist in its declared scope.");
        }
        ProductSource source = products.getFirst();
        requireMatchingScope(payload, "shopId", source.shopId());
        return new NotificationDefinition(
                "PRODUCT",
                source.shopId(),
                "New product \"" + source.name() + "\" added by " + source.shopName(),
                source.id(),
                null
        );
    }

    private NotificationDefinition discountDefinition(JsonNode payload) {
        String discountId = requiredText(payload, "discountId");
        List<DiscountSource> discounts = jdbcTemplate.query("""
                SELECT discount.id, discount.discount_name, discount.discount_value,
                       discount.discount_shop AS shop_id,
                       COALESCE(profile.name, 'Shop') AS shop_name
                  FROM discounts discount
                  JOIN accounts shop ON shop.id = discount.discount_shop
                  LEFT JOIN account_profiles profile ON profile."accountId" = shop.id
                 WHERE discount.id = :discountId AND discount.is_active = true
                   AND shop.is_active = true
                   AND shop.status = CAST('ACTIVE' AS "Status")
                   AND shop.account_type = CAST('SHOP' AS "AccountType")
                """, new MapSqlParameterSource("discountId", discountId),
                (resultSet, rowNumber) -> new DiscountSource(
                        resultSet.getString("id"),
                        resultSet.getString("discount_name"),
                        resultSet.getBigDecimal("discount_value").stripTrailingZeros().toPlainString(),
                        resultSet.getString("shop_id"),
                        resultSet.getString("shop_name")
                ));
        if (discounts.isEmpty()) {
            throw invalidEvent("The discount-created event target does not exist in its declared scope.");
        }
        DiscountSource source = discounts.getFirst();
        requireMatchingScope(payload, "shopId", source.shopId());
        return new NotificationDefinition(
                "DISCOUNT",
                source.shopId(),
                "New discount \"" + source.name() + "\" with " + source.value() + "% off from "
                        + source.shopName(),
                null,
                source.id()
        );
    }

    private EventReceipt receipt(String eventId) {
        return jdbcTemplate.query("""
                SELECT event_topic, payload_sha256, notification_count
                  FROM notification_event_receipts WHERE event_id = :eventId
                """, new MapSqlParameterSource("eventId", eventId), (resultSet, rowNumber) ->
                new EventReceipt(
                        resultSet.getString("event_topic"),
                        resultSet.getString("payload_sha256"),
                        resultSet.getInt("notification_count")
                )).stream().findFirst().orElseThrow(() ->
                new IllegalStateException("Conflicting event receipt is unavailable"));
    }

    private void validateEnvelope(String eventId, String topic, String rawPayload) {
        if (eventId == null || eventId.isBlank() || eventId.length() > 255) {
            throw invalidEvent("The event identifier is invalid.");
        }
        if (!JdbcDomainEventOutbox.PRODUCT_TOPIC.equals(topic)
                && !JdbcDomainEventOutbox.DISCOUNT_TOPIC.equals(topic)) {
            throw invalidEvent("Unsupported notification event topic.");
        }
        if (rawPayload == null || rawPayload.isBlank()
                || rawPayload.getBytes(StandardCharsets.UTF_8).length > MAX_EVENT_BYTES) {
            throw invalidEvent("The event payload is empty or too large.");
        }
    }

    private JsonNode parse(String rawPayload) {
        try {
            JsonNode payload = objectMapper.readTree(rawPayload);
            if (payload == null || !payload.isObject()) {
                throw invalidEvent("The event payload must be a JSON object.");
            }
            JsonNode version = payload.get("schemaVersion");
            if (version != null && (!version.canConvertToInt() || version.intValue() != 1)) {
                throw invalidEvent("The event schema version is unsupported.");
            }
            return payload;
        } catch (JsonProcessingException exception) {
            throw invalidEvent("The event payload is not valid JSON.");
        }
    }

    private String requiredText(JsonNode payload, String name) {
        String value = optionalText(payload, name);
        if (value == null) {
            throw invalidEvent("The event field " + name + " is required.");
        }
        return value;
    }

    private String optionalText(JsonNode payload, String name) {
        JsonNode value = payload.get(name);
        if (value == null || value.isNull()) {
            return null;
        }
        if (!value.isTextual() || value.textValue().isBlank() || value.textValue().length() > 200) {
            throw invalidEvent("The event field " + name + " is invalid.");
        }
        return value.textValue().trim();
    }

    private void requireMatchingScope(JsonNode payload, String name, String expected) {
        String supplied = optionalText(payload, name);
        if (supplied != null && !supplied.equals(expected)) {
            throw invalidEvent("The event target does not belong to the declared scope.");
        }
    }

    private String sha256(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

    private ApplicationException invalidEvent(String message) {
        return new ApplicationException(HttpStatus.BAD_REQUEST, "INVALID_EVENT_PAYLOAD", message);
    }

    private record EventReceipt(String topic, String payloadHash, int notificationCount) {
    }

    private record ProductSource(String id, String name, String shopId, String shopName) {
    }

    private record DiscountSource(String id, String name, String value, String shopId, String shopName) {
    }

    private record NotificationDefinition(
            String type,
            String senderId,
            String content,
            String productId,
            String discountId
    ) {
    }
}
