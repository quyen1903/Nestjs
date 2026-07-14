package com.itechwx.ecommerce.auth.security;

import com.itechwx.ecommerce.auth.application.LegacyCredentialReader;
import com.itechwx.ecommerce.auth.application.LegacyCredentialSnapshot;
import com.itechwx.ecommerce.auth.application.CredentialAttemptStore;
import com.itechwx.ecommerce.auth.application.VerifiedCredential;
import com.itechwx.ecommerce.auth.domain.ActorType;

import java.util.Locale;
import java.util.Optional;

public final class LegacyCredentialAuthenticator {

    private static final String DUMMY_SALT = "fixture-salt-2026";
    private static final String DUMMY_HASH =
            "8cce75b4630dee810ec38d6e98927058de043df00e9865f32ec86d0d6644d4bde"
                    + "c8fc55fb491bf1c9b61fcf723909b3e0c0703e762a74ef624e44eaa63549400";

    private final LegacyCredentialReader credentialReader;
    private final LegacyPasswordVerifier passwordVerifier;
    private final CredentialAttemptStore attemptStore;

    public LegacyCredentialAuthenticator(
            LegacyCredentialReader credentialReader,
            LegacyPasswordVerifier passwordVerifier,
            CredentialAttemptStore attemptStore
    ) {
        this.credentialReader = credentialReader;
        this.passwordVerifier = passwordVerifier;
        this.attemptStore = attemptStore;
    }

    public VerifiedCredential authenticate(String email, char[] password, ActorType expectedActorType) {
        if (email == null
                || email.isBlank()
                || email.length() > 320
                || password == null
                || expectedActorType == null
                || (expectedActorType != ActorType.USER && expectedActorType != ActorType.SHOP)) {
            performDummyVerification(password);
            throw new LegacyCredentialException();
        }

        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        Optional<LegacyCredentialSnapshot> found = credentialReader.findActiveByEmail(
                normalizedEmail,
                expectedActorType
        );
        LegacyCredentialSnapshot credential = found.orElse(null);
        String salt = credential == null || credential.passwordSalt() == null
                ? DUMMY_SALT
                : credential.passwordSalt();
        String hash = credential == null || credential.passwordHash() == null
                ? DUMMY_HASH
                : credential.passwordHash();

        boolean matches = passwordVerifier.matches(password, salt, hash);
        if (credential == null
                || !matches
                || !expectedActorType.name().equals(credential.accountType())) {
            if (credential != null) {
                attemptStore.recordFailure(credential.accountId());
            }
            throw new LegacyCredentialException();
        }
        attemptStore.recordSuccess(credential.accountId());
        return new VerifiedCredential(credential.accountId(), credential.email(), expectedActorType);
    }

    private void performDummyVerification(char[] password) {
        char[] bounded = password == null || password.length == 0 || password.length > 1024
                ? new char[]{'i', 'n', 'v', 'a', 'l', 'i', 'd'}
                : password;
        passwordVerifier.matches(bounded, DUMMY_SALT, DUMMY_HASH);
    }
}
