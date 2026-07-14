package com.itechwx.ecommerce.jobs.infrastructure;

import com.itechwx.ecommerce.inventory.application.InventoryReservationService;
import com.itechwx.ecommerce.jobs.application.OrderExpirationService;
import com.itechwx.ecommerce.jobs.config.OrderExpirationProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;

@Configuration(proxyBeanMethods = false)
public class OrderExpirationConfiguration {

    @Bean
    OrderExpirationService orderExpirationService(
            NamedParameterJdbcTemplate jdbcTemplate,
            TransactionTemplate transactionTemplate,
            InventoryReservationService reservationService,
            Clock authenticationClock
    ) {
        return new JdbcOrderExpirationService(
                jdbcTemplate, transactionTemplate, reservationService, authenticationClock
        );
    }

    @Bean
    @ConditionalOnProperty(name = "ecommerce.jobs.order-expiration.enabled", havingValue = "true")
    OrderExpirationJob orderExpirationJob(
            OrderExpirationService expirationService,
            OrderExpirationProperties properties
    ) {
        return new OrderExpirationJob(expirationService, properties);
    }
}
