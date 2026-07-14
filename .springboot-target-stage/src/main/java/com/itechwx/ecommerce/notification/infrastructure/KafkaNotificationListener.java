package com.itechwx.ecommerce.notification.infrastructure;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.itechwx.ecommerce.eventing.infrastructure.JdbcDomainEventOutbox;
import com.itechwx.ecommerce.notification.application.NotificationEventHandler;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;

public final class KafkaNotificationListener {

    private final NotificationEventHandler eventHandler;
    private final ObjectMapper objectMapper;

    public KafkaNotificationListener(
            NotificationEventHandler eventHandler,
            ObjectMapper objectMapper
    ) {
        this.eventHandler = eventHandler;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = {
            JdbcDomainEventOutbox.PRODUCT_TOPIC,
            JdbcDomainEventOutbox.DISCOUNT_TOPIC
    })
    public void consume(ConsumerRecord<String, String> record) {
        eventHandler.handle(eventId(record), record.topic(), record.value());
    }

    private String eventId(ConsumerRecord<String, String> record) {
        try {
            JsonNode payload = objectMapper.readTree(record.value());
            JsonNode supplied = payload == null ? null : payload.get("eventId");
            if (supplied != null) {
                return supplied.isTextual() ? supplied.textValue() : "";
            }
        } catch (Exception ignored) {
            // The handler performs authoritative JSON validation. A stable
            // Kafka-coordinate identifier still makes legacy poison messages traceable.
        }
        return "legacy:" + record.topic() + ":" + record.partition() + ":" + record.offset();
    }
}
