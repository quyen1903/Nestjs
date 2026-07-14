package com.itechwx.ecommerce.jobs.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties("ecommerce.jobs.order-expiration")
public record OrderExpirationProperties(
        boolean enabled,
        int batchSize,
        Duration fixedDelay
) {
    public OrderExpirationProperties {
        if (batchSize < 1 || batchSize > 1_000) {
            throw new IllegalArgumentException("order-expiration batch-size must be between 1 and 1000");
        }
        if (fixedDelay == null || fixedDelay.isNegative() || fixedDelay.isZero()) {
            throw new IllegalArgumentException("order-expiration fixed-delay must be positive");
        }
    }
}
