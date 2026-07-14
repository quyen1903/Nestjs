package com.itechwx.ecommerce.auth.security;

import com.itechwx.ecommerce.auth.config.GoogleOAuthProperties;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GoogleOAuthConfigurationTest {

    @Test
    void createsGoogleRegistrationWithCompatibilityCallback() {
        ClientRegistrationRepository repository = new GoogleOAuthConfiguration()
                .googleClientRegistrationRepository(new GoogleOAuthProperties(
                        true,
                        "fixture-client-id",
                        "fixture-client-secret",
                        "{baseUrl}/v1/api/auth/auth/google/callback"
                ));

        ClientRegistration registration = repository.findByRegistrationId("google");
        assertThat(registration).isNotNull();
        assertThat(registration.getRedirectUri())
                .isEqualTo("{baseUrl}/v1/api/auth/auth/google/callback");
        assertThat(registration.getScopes()).contains("openid", "email", "profile");
    }

    @Test
    void rejectsEnabledProviderWithoutCredentials() {
        assertThatThrownBy(() -> new GoogleOAuthConfiguration()
                .googleClientRegistrationRepository(new GoogleOAuthProperties(
                        true,
                        "",
                        "",
                        "{baseUrl}/v1/api/auth/auth/google/callback"
                ))).isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("GOOGLE_CLIENT_ID");
    }
}
