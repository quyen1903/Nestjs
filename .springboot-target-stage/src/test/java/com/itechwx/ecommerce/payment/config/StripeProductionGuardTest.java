package com.itechwx.ecommerce.payment.config;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class StripeProductionGuardTest {

    @Test
    void permitsDisabledProviderWithoutSecrets() {
        assertThatCode(() -> new StripeProductionGuard(
                new StripeProperties(false, "", "", "usd")
        )).doesNotThrowAnyException();
    }

    @Test
    void enabledProviderRequiresSecretAndWebhookKeys() {
        assertThatThrownBy(() -> new StripeProductionGuard(
                new StripeProperties(true, "local", "local", "usd")
        )).isInstanceOf(IllegalStateException.class);
        assertThatCode(() -> new StripeProductionGuard(new StripeProperties(
                true, "sk_live_synthetic_value", "whsec_synthetic_value", "usd"
        ))).doesNotThrowAnyException();
    }
}
