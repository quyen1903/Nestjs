package com.itechwx.ecommerce.payment.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("ecommerce.stripe")
public record StripeProperties(
        boolean enabled,
        String secretKey,
        String webhookSecret,
        String currency
) {
    public StripeProperties {
        secretKey = secretKey == null ? "" : secretKey.trim();
        webhookSecret = webhookSecret == null ? "" : webhookSecret.trim();
        currency = currency == null || currency.isBlank() ? "usd" : currency.trim().toLowerCase();
    }
}
