package com.itechwx.ecommerce.auth.security;

import org.springframework.security.core.AuthenticationException;

public final class LegacyCredentialException extends AuthenticationException {

    public LegacyCredentialException() {
        super("Credential authentication failed");
    }
}
