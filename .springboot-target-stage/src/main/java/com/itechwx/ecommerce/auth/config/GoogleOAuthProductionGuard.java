package com.itechwx.ecommerce.auth.config;

import org.springframework.beans.factory.InitializingBean;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.net.URI;

@Component
@Profile("production")
public class GoogleOAuthProductionGuard implements InitializingBean {

    private final GoogleOAuthProperties properties;

    public GoogleOAuthProductionGuard(GoogleOAuthProperties properties) {
        this.properties = properties;
    }

    @Override
    public void afterPropertiesSet() {
        if (!properties.enabled()) {
            return;
        }
        requireSecret(properties.clientId(), "Google OAuth client id");
        requireSecret(properties.clientSecret(), "Google OAuth client secret");
        URI callback;
        try {
            callback = URI.create(properties.redirectUri());
        } catch (RuntimeException exception) {
            throw new IllegalStateException("Google OAuth callback URL must be a valid HTTPS URL");
        }
        if (!"https".equalsIgnoreCase(callback.getScheme()) || callback.getHost() == null) {
            throw new IllegalStateException("Google OAuth callback URL must use HTTPS in production");
        }
    }

    private void requireSecret(String value, String label) {
        if (value == null || value.isBlank() || value.toLowerCase().contains("replace")) {
            throw new IllegalStateException(label + " must be supplied in production");
        }
    }
}
