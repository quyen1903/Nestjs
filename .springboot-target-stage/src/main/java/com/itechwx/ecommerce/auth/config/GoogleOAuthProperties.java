package com.itechwx.ecommerce.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("ecommerce.google-oauth")
public record GoogleOAuthProperties(
        boolean enabled,
        String clientId,
        String clientSecret,
        String redirectUri
) {
}
