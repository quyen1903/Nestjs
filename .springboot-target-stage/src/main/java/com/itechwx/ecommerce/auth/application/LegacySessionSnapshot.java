package com.itechwx.ecommerce.auth.application;

import java.util.List;
import java.util.Objects;

public record LegacySessionSnapshot(
        String keyTokenId,
        String accountId,
        String deviceId,
        String email,
        String accountType,
        String publicKeyPem,
        Long keyExpiresAtEpochMillis,
        List<String> roles,
        List<String> permissions,
        boolean presentedTokenIsRefreshToken
) {
    public LegacySessionSnapshot {
        keyTokenId = Objects.requireNonNull(keyTokenId);
        accountId = Objects.requireNonNull(accountId);
        deviceId = Objects.requireNonNull(deviceId);
        email = Objects.requireNonNull(email);
        accountType = Objects.requireNonNull(accountType);
        publicKeyPem = Objects.requireNonNull(publicKeyPem);
        roles = List.copyOf(roles);
        permissions = List.copyOf(permissions);
    }
}
