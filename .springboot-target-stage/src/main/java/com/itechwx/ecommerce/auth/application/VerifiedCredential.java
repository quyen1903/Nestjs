package com.itechwx.ecommerce.auth.application;

import com.itechwx.ecommerce.auth.domain.ActorType;

import java.util.Objects;

public record VerifiedCredential(String accountId, String email, ActorType actorType) {
    public VerifiedCredential {
        accountId = Objects.requireNonNull(accountId);
        email = Objects.requireNonNull(email);
        actorType = Objects.requireNonNull(actorType);
    }
}
