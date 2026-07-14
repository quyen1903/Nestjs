package com.itechwx.ecommerce.notification.infrastructure;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.itechwx.ecommerce.notification.application.NotificationEventHandler;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;

@Configuration(proxyBeanMethods = false)
public class NotificationConfiguration {

    @Bean
    NotificationEventHandler notificationEventHandler(
            NamedParameterJdbcTemplate jdbcTemplate,
            TransactionTemplate transactionTemplate,
            ObjectMapper objectMapper,
            Clock authenticationClock
    ) {
        return new JdbcNotificationEventHandler(
                jdbcTemplate, transactionTemplate, objectMapper, authenticationClock
        );
    }

    @Bean
    @ConditionalOnProperty(name = "ecommerce.kafka.enabled", havingValue = "true")
    KafkaNotificationListener kafkaNotificationListener(
            NotificationEventHandler eventHandler,
            ObjectMapper objectMapper
    ) {
        return new KafkaNotificationListener(eventHandler, objectMapper);
    }
}
