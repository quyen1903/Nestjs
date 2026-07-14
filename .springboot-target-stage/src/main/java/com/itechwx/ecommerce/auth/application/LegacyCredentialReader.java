package com.itechwx.ecommerce.auth.application;

import com.itechwx.ecommerce.auth.domain.ActorType;

import java.util.Optional;

public interface LegacyCredentialReader {

    Optional<LegacyCredentialSnapshot> findActiveByEmail(String normalizedEmail, ActorType actorType);
}
