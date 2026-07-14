package com.itechwx.ecommerce.payment.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("production")
class StripeProductionGuard {

    StripeProductionGuard(StripeProperties properties) {
        if (!properties.enabled()) {
            return;
        }
        if (!properties.secretKey().startsWith("sk_") || properties.secretKey().length() < 12) {
            throw new IllegalStateException("Enabled Stripe production configuration requires a secret key");
        }
        if (!properties.webhookSecret().startsWith("whsec_") || properties.webhookSecret().length() < 12) {
            throw new IllegalStateException("Enabled Stripe production configuration requires a webhook secret");
        }
        if (!properties.currency().matches("[a-z]{3}")) {
            throw new IllegalStateException("Stripe currency must be a lowercase ISO-style three-letter code");
        }
    }
}
