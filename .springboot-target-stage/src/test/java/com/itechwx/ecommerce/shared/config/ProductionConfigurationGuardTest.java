package com.itechwx.ecommerce.shared.config;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ProductionConfigurationGuardTest {

    @Test
    void acceptsExplicitHttpsProductionConfiguration() {
        assertThatCode(() -> new ProductionConfigurationGuard(properties(
                List.of("https://shop.example.com"),
                "https://identity.example.com",
                "ecommerce-api"
        ))).doesNotThrowAnyException();
    }

    @Test
    void rejectsLocalCorsOrigin() {
        assertThatThrownBy(() -> new ProductionConfigurationGuard(properties(
                List.of("http://localhost:3000"),
                "https://identity.example.com",
                "ecommerce-api"
        )))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("CORS origins");
    }

    @Test
    void rejectsLocalTokenIssuer() {
        assertThatThrownBy(() -> new ProductionConfigurationGuard(properties(
                List.of("https://shop.example.com"),
                "local-ecommerce",
                "ecommerce-api"
        )))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("issuer and audience");
    }

    @Test
    void rejectsLocalTokenDigestPepper() {
        EcommerceProperties properties = new EcommerceProperties(
                new EcommerceProperties.Cors(List.of("https://shop.example.com")),
                new EcommerceProperties.Request("X-Request-Id", 2_097_152),
                new EcommerceProperties.Security(
                        "https://identity.example.com",
                        "ecommerce-api",
                        "local-token-digest-pepper-change-me",
                        8192,
                        60
                )
        );

        assertThatThrownBy(() -> new ProductionConfigurationGuard(properties))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("digest pepper");
    }

    private EcommerceProperties properties(List<String> origins, String issuer, String audience) {
        return new EcommerceProperties(
                new EcommerceProperties.Cors(origins),
                new EcommerceProperties.Request("X-Request-Id", 2_097_152),
                new EcommerceProperties.Security(
                        issuer, audience, "production-pepper-fixture-value-123456", 8192, 60
                )
        );
    }
}
