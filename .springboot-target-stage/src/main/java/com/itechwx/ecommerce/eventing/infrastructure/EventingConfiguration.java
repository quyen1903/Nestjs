package com.itechwx.ecommerce.eventing.infrastructure;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.itechwx.ecommerce.eventing.application.DomainEventOutbox;
import com.itechwx.ecommerce.eventing.application.EventPublisher;
import com.itechwx.ecommerce.eventing.config.KafkaEventProperties;
import org.apache.kafka.common.TopicPartition;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.CommonErrorHandler;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.backoff.FixedBackOff;

import java.time.Clock;

@Configuration(proxyBeanMethods = false)
@EnableScheduling
public class EventingConfiguration {

    @Bean
    DomainEventOutbox domainEventOutbox(
            NamedParameterJdbcTemplate jdbcTemplate,
            ObjectMapper objectMapper,
            KafkaEventProperties properties,
            Clock authenticationClock
    ) {
        return new JdbcDomainEventOutbox(jdbcTemplate, objectMapper, properties, authenticationClock);
    }

    @Bean
    @ConditionalOnProperty(name = "ecommerce.kafka.enabled", havingValue = "true")
    EventPublisher kafkaEventPublisher(KafkaTemplate<String, String> kafkaTemplate) {
        return new KafkaEventPublisher(kafkaTemplate);
    }

    @Bean
    @ConditionalOnProperty(name = "ecommerce.kafka.enabled", havingValue = "true")
    JdbcOutboxDispatcher jdbcOutboxDispatcher(
            NamedParameterJdbcTemplate jdbcTemplate,
            TransactionTemplate transactionTemplate,
            EventPublisher publisher,
            KafkaEventProperties properties,
            Clock authenticationClock
    ) {
        return new JdbcOutboxDispatcher(
                jdbcTemplate, transactionTemplate, publisher, properties, authenticationClock
        );
    }

    @Bean
    @ConditionalOnProperty(name = "ecommerce.kafka.enabled", havingValue = "true")
    OutboxDispatchJob outboxDispatchJob(JdbcOutboxDispatcher dispatcher) {
        return new OutboxDispatchJob(dispatcher);
    }

    @Bean
    @ConditionalOnProperty(name = "ecommerce.kafka.enabled", havingValue = "true")
    CommonErrorHandler kafkaErrorHandler(KafkaTemplate<String, String> kafkaTemplate) {
        DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(
                kafkaTemplate,
                (record, exception) -> new TopicPartition(record.topic() + ".DLT", record.partition())
        );
        return new DefaultErrorHandler(recoverer, new FixedBackOff(1_000, 3));
    }
}
