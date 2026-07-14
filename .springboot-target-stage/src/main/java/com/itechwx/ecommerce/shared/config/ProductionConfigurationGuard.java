package com.itechwx.ecommerce.shared.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("production")
class ProductionConfigurationGuard {

    ProductionConfigurationGuard(EcommerceProperties properties) {
        if (properties.cors().allowedOrigins().stream().anyMatch(this::isUnsafeOrigin)) {
            throw new IllegalStateException("Production CORS origins must be explicit non-local HTTPS origins");
        }
        if (properties.security().issuer().startsWith("local-")
                || properties.security().audience().startsWith("local-")) {
            throw new IllegalStateException("Production token issuer and audience must not use local defaults");
        }
        if (properties.security().tokenDigestPepper().startsWith("local-")) {
            throw new IllegalStateException("Production token digest pepper must not use the local default");
        }
    }

    private boolean isUnsafeOrigin(String origin) {
        return "*".equals(origin)
                || origin.startsWith("http://localhost")
                || origin.startsWith("http://127.0.0.1")
                || !origin.startsWith("https://");
    }
}
