package com.itechwx.ecommerce.auth.security;

import org.springframework.security.core.AuthenticationException;

public final class LegacyAuthenticationException extends AuthenticationException {

    public LegacyAuthenticationException() {
        super("Legacy access-token authentication failed");
    }

    public LegacyAuthenticationException(Throwable cause) {
        super("Legacy access-token authentication failed", cause);
    }
}
