package com.itechwx.ecommerce.inventory.infrastructure;

import com.itechwx.ecommerce.inventory.application.InventoryReservationService;
import com.itechwx.ecommerce.inventory.application.InventoryService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;

@Configuration(proxyBeanMethods = false)
public class InventoryConfiguration {

    @Bean
    InventoryService inventoryService(
            NamedParameterJdbcTemplate jdbcTemplate,
            TransactionTemplate transactionTemplate,
            Clock authenticationClock
    ) {
        return new JdbcInventoryService(jdbcTemplate, transactionTemplate, authenticationClock);
    }

    @Bean
    InventoryReservationService inventoryReservationService(
            NamedParameterJdbcTemplate jdbcTemplate,
            TransactionTemplate transactionTemplate,
            Clock authenticationClock
    ) {
        return new JdbcInventoryReservationService(jdbcTemplate, transactionTemplate, authenticationClock);
    }
}
