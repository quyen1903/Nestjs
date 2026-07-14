package com.itechwx.ecommerce.auth.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.net.URI;

@Configuration
@Profile("production")
class PasswordResetProductionGuard {

    PasswordResetProductionGuard(PasswordResetProperties properties) {
        URI resetUri = URI.create(properties.resetBaseUrl());
        if (!"https".equalsIgnoreCase(resetUri.getScheme()) || resetUri.getHost() == null) {
            throw new IllegalStateException("Production password reset URL must be absolute HTTPS");
        }
        if (properties.fromAddress().endsWith(".test")) {
            throw new IllegalStateException("Production password reset sender must not use a test address");
        }
    }
}
