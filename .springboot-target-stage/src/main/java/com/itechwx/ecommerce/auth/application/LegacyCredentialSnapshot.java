package com.itechwx.ecommerce.auth.application;

import java.util.Objects;

public record LegacyCredentialSnapshot(
        String accountId,
        String email,
        String accountType,
        String passwordHash,
        String passwordSalt
) {
    public LegacyCredentialSnapshot {
        accountId = Objects.requireNonNull(accountId);
        email = Objects.requireNonNull(email);
        accountType = Objects.requireNonNull(accountType);
    }
}
