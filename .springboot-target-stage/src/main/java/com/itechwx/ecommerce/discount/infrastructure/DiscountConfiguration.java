package com.itechwx.ecommerce.discount.infrastructure;

import com.itechwx.ecommerce.discount.application.DiscountService;
import com.itechwx.ecommerce.eventing.application.DomainEventOutbox;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;

@Configuration(proxyBeanMethods = false)
public class DiscountConfiguration {

    @Bean
    DiscountService discountService(
            NamedParameterJdbcTemplate jdbcTemplate,
            TransactionTemplate transactionTemplate,
            DomainEventOutbox eventOutbox,
            Clock authenticationClock
    ) {
        return new JdbcDiscountService(jdbcTemplate, transactionTemplate, authenticationClock, eventOutbox);
    }
}
