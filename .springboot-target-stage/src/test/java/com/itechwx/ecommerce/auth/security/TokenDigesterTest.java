package com.itechwx.ecommerce.auth.security;

import com.itechwx.ecommerce.shared.config.EcommerceProperties;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class TokenDigesterTest {

    @Test
    void createsStablePepperedDigestAndComparesInConstantTimeApi() {
        TokenDigester digester = new TokenDigester(properties("pepper-value-fixture-123456789012"));

        String digest = digester.digest("token-fixture");

        assertThat(digest).hasSize(64).doesNotContain("token-fixture");
        assertThat(digester.matches(digest, "token-fixture")).isTrue();
        assertThat(digester.matches(digest, "other-token")).isFalse();
    }

    @Test
    void differentPepperProducesDifferentDigest() {
        String first = new TokenDigester(properties("pepper-value-fixture-123456789012"))
                .digest("token-fixture");
        String second = new TokenDigester(properties("other-pepper-fixture-1234567890123"))
                .digest("token-fixture");

        assertThat(first).isNotEqualTo(second);
    }

    private EcommerceProperties properties(String pepper) {
        return new EcommerceProperties(
                new EcommerceProperties.Cors(List.of("http://localhost:3000")),
                new EcommerceProperties.Request("X-Request-Id", 2_097_152),
                new EcommerceProperties.Security(
                        "local-test", "ecommerce-api", pepper, 8192, 60
                )
        );
    }
}
