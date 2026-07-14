package com.itechwx.ecommerce.checkout.infrastructure;

import com.itechwx.ecommerce.checkout.application.CheckoutService;
import com.itechwx.ecommerce.discount.application.DiscountService;
import com.itechwx.ecommerce.inventory.application.InventoryReservationService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;

@Configuration(proxyBeanMethods = false)
public class CheckoutConfiguration {

    @Bean
    CheckoutService checkoutService(
            NamedParameterJdbcTemplate jdbcTemplate,
            TransactionTemplate transactionTemplate,
            InventoryReservationService reservationService,
            DiscountService discountService,
            Clock authenticationClock
    ) {
        return new JdbcCheckoutService(
                jdbcTemplate,
                transactionTemplate,
                reservationService,
                discountService,
                authenticationClock
        );
    }
}
