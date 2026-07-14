package com.itechwx.ecommerce.auth.security;

import com.itechwx.ecommerce.auth.application.IssuedTokenPair;
import com.itechwx.ecommerce.auth.application.LegacySessionReader;
import com.itechwx.ecommerce.auth.application.LegacySessionSnapshot;
import com.itechwx.ecommerce.auth.application.VerifiedCredential;
import com.itechwx.ecommerce.auth.domain.ActorType;
import com.itechwx.ecommerce.auth.domain.UserPrincipal;
import com.itechwx.ecommerce.shared.config.EcommerceProperties;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jwt.SignedJWT;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class LegacyTokenIssuerTest {

    private static final Instant NOW = Instant.parse("2026-06-29T12:00:00Z");

    @Test
    void issuesNestCompatibleRs256PairWithExplicitPurposeIssuerAndAudience() throws Exception {
        EcommerceProperties properties = properties();
        LegacyTokenIssuer issuer = new LegacyTokenIssuer(
                Clock.fixed(NOW, ZoneOffset.UTC),
                properties
        );

        IssuedTokenPair pair = issuer.issue(
                new VerifiedCredential("account-fixture", "fixture@example.test", ActorType.USER),
                "device-fixture"
        );
        SignedJWT access = SignedJWT.parse(pair.accessToken());
        SignedJWT refresh = SignedJWT.parse(pair.refreshToken());

        assertThat(access.getHeader().getAlgorithm()).isEqualTo(JWSAlgorithm.RS256);
        assertThat(access.getJWTClaimsSet().getStringClaim("accountId")).isEqualTo("account-fixture");
        assertThat(access.getJWTClaimsSet().getStringClaim("tokenType")).isEqualTo("ACCESS");
        assertThat(access.getJWTClaimsSet().getIssuer()).isEqualTo("local-test");
        assertThat(access.getJWTClaimsSet().getAudience()).containsExactly("ecommerce-api");
        assertThat(refresh.getJWTClaimsSet().getStringClaim("tokenType")).isEqualTo("REFRESH");
        assertThat(pair.publicKeyPem()).startsWith("-----BEGIN RSA PUBLIC KEY-----");
        assertThat(pair.refreshExpiresAtEpochMillis()).isEqualTo(NOW.plusSeconds(6 * 3600).toEpochMilli());
    }

    @Test
    void accessAuthenticatorAcceptsIssuedAccessAndRejectsIssuedRefreshEvenWithoutRawEqualityFlag() {
        EcommerceProperties properties = properties();
        LegacyTokenIssuer issuer = new LegacyTokenIssuer(
                Clock.fixed(NOW, ZoneOffset.UTC),
                properties
        );
        IssuedTokenPair pair = issuer.issue(
                new VerifiedCredential("account-fixture", "fixture@example.test", ActorType.USER),
                "device-fixture"
        );
        LegacySessionReader reader = mock(LegacySessionReader.class);
        LegacySessionSnapshot session = new LegacySessionSnapshot(
                "key-fixture",
                "account-fixture",
                "device-fixture",
                "fixture@example.test",
                "USER",
                pair.publicKeyPem(),
                pair.refreshExpiresAtEpochMillis(),
                List.of("USER"),
                List.of("user:read"),
                false
        );
        when(reader.findActive("account-fixture", "device-fixture", pair.accessToken()))
                .thenReturn(Optional.of(session));
        when(reader.findActive("account-fixture", "device-fixture", pair.refreshToken()))
                .thenReturn(Optional.of(session));
        LegacyAccessTokenAuthenticator authenticator = new LegacyAccessTokenAuthenticator(
                reader,
                properties,
                Clock.fixed(NOW.plusSeconds(1), ZoneOffset.UTC)
        );

        assertThat(authenticator.authenticate(pair.accessToken())).isInstanceOf(UserPrincipal.class);
        assertThatThrownBy(() -> authenticator.authenticate(pair.refreshToken()))
                .isInstanceOf(LegacyAuthenticationException.class);
    }

    @Test
    void refreshVerifierRequiresRefreshPurposeAndExpectedActor() {
        EcommerceProperties properties = properties();
        LegacyTokenIssuer issuer = new LegacyTokenIssuer(
                Clock.fixed(NOW, ZoneOffset.UTC),
                properties
        );
        IssuedTokenPair pair = issuer.issue(
                new VerifiedCredential("account-fixture", "fixture@example.test", ActorType.USER),
                "device-fixture"
        );
        LegacyRefreshTokenVerifier verifier = new LegacyRefreshTokenVerifier(
                Clock.fixed(NOW.plusSeconds(1), ZoneOffset.UTC),
                properties
        );

        assertThat(verifier.decodeUnverified(pair.refreshToken()).accountId())
                .isEqualTo("account-fixture");
        org.assertj.core.api.Assertions.assertThatCode(() -> verifier.verify(
                pair.refreshToken(), pair.publicKeyPem(), pair.refreshExpiresAtEpochMillis(), ActorType.USER
        )).doesNotThrowAnyException();
        assertThatThrownBy(() -> verifier.verify(
                pair.accessToken(), pair.publicKeyPem(), pair.refreshExpiresAtEpochMillis(), ActorType.USER
        )).isInstanceOf(LegacyAuthenticationException.class);
        assertThatThrownBy(() -> verifier.verify(
                pair.refreshToken(), pair.publicKeyPem(), pair.refreshExpiresAtEpochMillis(), ActorType.SHOP
        )).isInstanceOf(LegacyAuthenticationException.class);
    }

    private EcommerceProperties properties() {
        return new EcommerceProperties(
                new EcommerceProperties.Cors(List.of("http://localhost:3000")),
                new EcommerceProperties.Request("X-Request-Id", 2_097_152),
                new EcommerceProperties.Security(
                        "local-test",
                        "ecommerce-api",
                        "local-test-pepper-value-123456789",
                        8192,
                        60
                )
        );
    }
}
