package com.itechwx.ecommerce.eventing.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties("ecommerce.kafka")
public record KafkaEventProperties(
        boolean enabled,
        int outboxBatchSize,
        Duration claimTimeout
) {
    public KafkaEventProperties {
        if (outboxBatchSize < 1 || outboxBatchSize > 1_000) {
            throw new IllegalArgumentException("ecommerce.kafka.outbox-batch-size must be between 1 and 1000");
        }
        if (claimTimeout == null || claimTimeout.isNegative() || claimTimeout.isZero()) {
            throw new IllegalArgumentException("ecommerce.kafka.claim-timeout must be positive");
        }
    }
}
