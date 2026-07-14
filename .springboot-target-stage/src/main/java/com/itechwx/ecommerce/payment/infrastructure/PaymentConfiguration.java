package com.itechwx.ecommerce.payment.infrastructure;

import com.itechwx.ecommerce.inventory.application.InventoryReservationService;
import com.itechwx.ecommerce.payment.application.PaymentGateway;
import com.itechwx.ecommerce.payment.application.PaymentService;
import com.itechwx.ecommerce.payment.config.StripeProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;

@Configuration(proxyBeanMethods = false)
public class PaymentConfiguration {

    @Bean
    @ConditionalOnProperty(prefix = "ecommerce.stripe", name = "enabled", havingValue = "true")
    PaymentGateway stripePaymentGateway(StripeProperties properties) {
        if (properties.secretKey().isBlank() || properties.webhookSecret().isBlank()) {
            throw new IllegalStateException("Enabled Stripe configuration requires both secrets");
        }
        return new StripePaymentGateway(properties);
    }

    @Bean
    @ConditionalOnProperty(
            prefix = "ecommerce.stripe",
            name = "enabled",
            havingValue = "false",
            matchIfMissing = true
    )
    PaymentGateway unavailablePaymentGateway() {
        return new UnavailablePaymentGateway();
    }

    @Bean
    JdbcPaymentStore paymentStore(
            NamedParameterJdbcTemplate jdbcTemplate,
            TransactionTemplate transactionTemplate,
            InventoryReservationService reservationService,
            StripeProperties properties,
            Clock authenticationClock
    ) {
        return new JdbcPaymentStore(
                jdbcTemplate, transactionTemplate, reservationService, properties, authenticationClock
        );
    }

    @Bean
    PaymentService paymentService(
            PaymentGateway gateway,
            JdbcPaymentStore paymentStore,
            StripeProperties properties
    ) {
        return new DefaultPaymentService(gateway, paymentStore, properties);
    }
}
