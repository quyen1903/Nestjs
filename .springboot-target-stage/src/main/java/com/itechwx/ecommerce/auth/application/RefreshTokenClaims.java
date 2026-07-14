package com.itechwx.ecommerce.auth.application;

import java.util.Objects;

public record RefreshTokenClaims(String accountId, String deviceId) {
    public RefreshTokenClaims {
        accountId = Objects.requireNonNull(accountId);
        deviceId = Objects.requireNonNull(deviceId);
    }
}
