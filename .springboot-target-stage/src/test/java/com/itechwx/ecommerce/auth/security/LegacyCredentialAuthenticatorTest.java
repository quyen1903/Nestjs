package com.itechwx.ecommerce.auth.security;

import com.itechwx.ecommerce.auth.application.LegacyCredentialReader;
import com.itechwx.ecommerce.auth.application.LegacyCredentialSnapshot;
import com.itechwx.ecommerce.auth.application.CredentialAttemptStore;
import com.itechwx.ecommerce.auth.application.VerifiedCredential;
import com.itechwx.ecommerce.auth.domain.ActorType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.when;

class LegacyCredentialAuthenticatorTest {

    private LegacyCredentialReader reader;
    private LegacyPasswordVerifier verifier;
    private CredentialAttemptStore attemptStore;
    private LegacyCredentialAuthenticator authenticator;

    @BeforeEach
    void setUp() {
        reader = mock(LegacyCredentialReader.class);
        verifier = mock(LegacyPasswordVerifier.class);
        attemptStore = mock(CredentialAttemptStore.class);
        authenticator = new LegacyCredentialAuthenticator(reader, verifier, attemptStore);
    }

    @Test
    void normalizesEmailAndScopesCredentialLookupByActorType() {
        LegacyCredentialSnapshot snapshot = new LegacyCredentialSnapshot(
                "account-fixture",
                "fixture@example.test",
                "SHOP",
                "hash-fixture",
                "salt-fixture"
        );
        when(reader.findActiveByEmail("fixture@example.test", ActorType.SHOP))
                .thenReturn(Optional.of(snapshot));
        when(verifier.matches(any(char[].class), anyString(), anyString())).thenReturn(true);

        VerifiedCredential verified = authenticator.authenticate(
                "  FIXTURE@EXAMPLE.TEST ",
                "FixturePass123!".toCharArray(),
                ActorType.SHOP
        );

        assertThat(verified.accountId()).isEqualTo("account-fixture");
        assertThat(verified.actorType()).isEqualTo(ActorType.SHOP);
        verify(attemptStore).recordSuccess("account-fixture");
    }

    @Test
    void missingAndWrongCredentialsReturnSameSafeExceptionAndStillHash() {
        when(reader.findActiveByEmail(anyString(), any())).thenReturn(Optional.empty());
        when(verifier.matches(any(char[].class), anyString(), anyString())).thenReturn(false);

        assertThatThrownBy(() -> authenticator.authenticate(
                "missing@example.test",
                "FixturePass123!".toCharArray(),
                ActorType.USER
        )).isExactlyInstanceOf(LegacyCredentialException.class);

        verify(verifier).matches(any(char[].class), anyString(), anyString());
        verify(attemptStore, never()).recordFailure(anyString());
    }

    @Test
    void recordsFailedAttemptForKnownAccountWithoutChangingTheSafeError() {
        LegacyCredentialSnapshot snapshot = new LegacyCredentialSnapshot(
                "account-fixture",
                "fixture@example.test",
                "USER",
                "hash-fixture",
                "salt-fixture"
        );
        when(reader.findActiveByEmail("fixture@example.test", ActorType.USER))
                .thenReturn(Optional.of(snapshot));
        when(verifier.matches(any(char[].class), anyString(), anyString())).thenReturn(false);

        assertThatThrownBy(() -> authenticator.authenticate(
                "fixture@example.test",
                "WrongPass123!".toCharArray(),
                ActorType.USER
        )).isExactlyInstanceOf(LegacyCredentialException.class);

        verify(attemptStore).recordFailure("account-fixture");
    }

    @Test
    void doesNotTreatAdminAsPasswordLoginWithoutAnApprovedRoute() {
        when(verifier.matches(any(char[].class), anyString(), anyString())).thenReturn(false);

        assertThatThrownBy(() -> authenticator.authenticate(
                "admin@example.test",
                "FixturePass123!".toCharArray(),
                ActorType.ADMIN
        )).isExactlyInstanceOf(LegacyCredentialException.class);
    }
}
