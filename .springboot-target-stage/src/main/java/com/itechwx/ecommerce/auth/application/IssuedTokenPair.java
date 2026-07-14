package com.itechwx.ecommerce.auth.application;

import java.util.Objects;

public record IssuedTokenPair(
        String accessToken,
        String refreshToken,
        String publicKeyPem,
        long refreshExpiresAtEpochMillis
) {
    public IssuedTokenPair {
        accessToken = Objects.requireNonNull(accessToken);
        refreshToken = Objects.requireNonNull(refreshToken);
        publicKeyPem = Objects.requireNonNull(publicKeyPem);
    }
}
