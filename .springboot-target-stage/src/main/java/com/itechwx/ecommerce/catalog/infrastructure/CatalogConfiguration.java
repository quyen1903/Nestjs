package com.itechwx.ecommerce.catalog.infrastructure;

import com.itechwx.ecommerce.catalog.application.CatalogService;
import com.itechwx.ecommerce.catalog.application.CategoryService;
import com.itechwx.ecommerce.eventing.application.DomainEventOutbox;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;

@Configuration(proxyBeanMethods = false)
public class CatalogConfiguration {

    @Bean
    CatalogService catalogService(
            NamedParameterJdbcTemplate jdbcTemplate,
            TransactionTemplate transactionTemplate,
            DomainEventOutbox eventOutbox,
            Clock authenticationClock
    ) {
        return new JdbcCatalogService(jdbcTemplate, transactionTemplate, authenticationClock, eventOutbox);
    }

    @Bean
    CategoryService categoryService(
            NamedParameterJdbcTemplate jdbcTemplate,
            TransactionTemplate transactionTemplate,
            Clock authenticationClock
    ) {
        return new JdbcCategoryService(jdbcTemplate, transactionTemplate, authenticationClock);
    }
}
