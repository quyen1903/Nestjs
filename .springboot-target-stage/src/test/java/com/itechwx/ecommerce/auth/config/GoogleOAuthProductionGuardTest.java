package com.itechwx.ecommerce.auth.config;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GoogleOAuthProductionGuardTest {

    @Test
    void allowsDisabledProviderAndValidHttpsConfiguration() {
        assertThatCode(() -> new GoogleOAuthProductionGuard(
                new GoogleOAuthProperties(false, "", "", "")
        ).afterPropertiesSet()).doesNotThrowAnyException();
        assertThatCode(() -> new GoogleOAuthProductionGuard(
                new GoogleOAuthProperties(
                        true,
                        "fixture-client-id",
                        "fixture-client-secret",
                        "https://api.example.test/v1/api/auth/auth/google/callback"
                )
        ).afterPropertiesSet()).doesNotThrowAnyException();
    }

    @Test
    void rejectsInsecureProductionCallback() {
        assertThatThrownBy(() -> new GoogleOAuthProductionGuard(
                new GoogleOAuthProperties(
                        true,
                        "fixture-client-id",
                        "fixture-client-secret",
                        "http://localhost:3057/v1/api/auth/auth/google/callback"
                )
        ).afterPropertiesSet()).isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("HTTPS");
    }
}
