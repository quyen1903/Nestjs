package com.itechwx.ecommerce.jobs.infrastructure;

import com.itechwx.ecommerce.jobs.application.OrderExpirationService;
import com.itechwx.ecommerce.jobs.config.OrderExpirationProperties;
import org.springframework.scheduling.annotation.Scheduled;

public final class OrderExpirationJob {

    private final OrderExpirationService expirationService;
    private final OrderExpirationProperties properties;

    public OrderExpirationJob(
            OrderExpirationService expirationService,
            OrderExpirationProperties properties
    ) {
        this.expirationService = expirationService;
        this.properties = properties;
    }

    @Scheduled(fixedDelayString = "${ecommerce.jobs.order-expiration.fixed-delay:PT15M}")
    public void expire() {
        expirationService.expireBatch(properties.batchSize());
    }
}
