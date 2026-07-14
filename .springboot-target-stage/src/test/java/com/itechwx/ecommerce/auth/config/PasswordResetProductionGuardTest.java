package com.itechwx.ecommerce.auth.config;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PasswordResetProductionGuardTest {

    @Test
    void acceptsHttpsProductionResetConfiguration() {
        assertThatCode(() -> new PasswordResetProductionGuard(new PasswordResetProperties(
                "no-reply@example.com",
                "https://shop.example.com/reset-password"
        ))).doesNotThrowAnyException();
    }

    @Test
    void rejectsLocalOrTestProductionResetConfiguration() {
        assertThatThrownBy(() -> new PasswordResetProductionGuard(new PasswordResetProperties(
                "no-reply@example.com",
                "http://localhost:3000/reset-password"
        ))).isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> new PasswordResetProductionGuard(new PasswordResetProperties(
                "no-reply@example.test",
                "https://shop.example.com/reset-password"
        ))).isInstanceOf(IllegalStateException.class);
    }
}
