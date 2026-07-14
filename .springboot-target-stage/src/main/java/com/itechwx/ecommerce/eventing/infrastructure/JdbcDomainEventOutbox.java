package com.itechwx.ecommerce.eventing.infrastructure;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.itechwx.ecommerce.eventing.application.DomainEventOutbox;
import com.itechwx.ecommerce.eventing.config.KafkaEventProperties;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Clock;
import java.util.Map;
import java.util.UUID;

public final class JdbcDomainEventOutbox implements DomainEventOutbox {

    public static final String PRODUCT_TOPIC = "product-created";
    public static final String DISCOUNT_TOPIC = "discount-created";

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private final KafkaEventProperties properties;
    private final Clock clock;

    public JdbcDomainEventOutbox(
            NamedParameterJdbcTemplate jdbcTemplate,
            ObjectMapper objectMapper,
            KafkaEventProperties properties,
            Clock clock
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
        this.properties = properties;
        this.clock = clock;
    }

    @Override
    public void productCreated(String productId, String productName, String shopId) {
        enqueue(
                "PRODUCT",
                productId,
                "ProductCreated",
                PRODUCT_TOPIC,
                productId,
                Map.of(
                        "schemaVersion", 1,
                        "productId", productId,
                        "productName", productName,
                        "shopId", shopId
                )
        );
    }

    @Override
    public void discountCreated(
            String discountId,
            String discountName,
            BigDecimal discountValue,
            String shopId
    ) {
        enqueue(
                "DISCOUNT",
                discountId,
                "DiscountCreated",
                DISCOUNT_TOPIC,
                discountId,
                Map.of(
                        "schemaVersion", 1,
                        "discountId", discountId,
                        "discountName", discountName,
                        "discountValue", discountValue,
                        "shopId", shopId
                )
        );
    }

    private void enqueue(
            String aggregateType,
            String aggregateId,
            String eventType,
            String topic,
            String eventKey,
            Map<String, Object> fields
    ) {
        if (!properties.enabled()) {
            return;
        }
        String id = UUID.randomUUID().toString();
        Map<String, Object> payload = new java.util.LinkedHashMap<>();
        payload.put("eventId", id);
        payload.putAll(fields);
        String serialized;
        try {
            serialized = objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to serialize a domain event", exception);
        }
        jdbcTemplate.update("""
                INSERT INTO domain_event_outbox(
                    id, aggregate_type, aggregate_id, event_type, topic, event_key,
                    payload, status, attempts, available_at, created_at, updated_at
                ) VALUES (
                    :id, :aggregateType, :aggregateId, :eventType, :topic, :eventKey,
                    CAST(:payload AS jsonb), 'PENDING', 0, :availableAt, :now, :now
                )
                """, new MapSqlParameterSource()
                .addValue("id", id)
                .addValue("aggregateType", aggregateType)
                .addValue("aggregateId", aggregateId)
                .addValue("eventType", eventType)
                .addValue("topic", topic)
                .addValue("eventKey", eventKey)
                .addValue("payload", serialized)
                .addValue("availableAt", Timestamp.from(clock.instant()))
                .addValue("now", clock.millis()));
    }
}
