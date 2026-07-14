package com.itechwx.ecommerce.cart.infrastructure;

import com.itechwx.ecommerce.cart.application.CartService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;

@Configuration(proxyBeanMethods = false)
public class CartConfiguration {

    @Bean
    CartService cartService(
            NamedParameterJdbcTemplate jdbcTemplate,
            TransactionTemplate transactionTemplate,
            Clock authenticationClock
    ) {
        return new JdbcCartService(jdbcTemplate, transactionTemplate, authenticationClock);
    }
}
