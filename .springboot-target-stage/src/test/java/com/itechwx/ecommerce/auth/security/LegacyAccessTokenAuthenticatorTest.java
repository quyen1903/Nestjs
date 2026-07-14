package com.itechwx.ecommerce.auth.security;

import com.itechwx.ecommerce.auth.application.LegacySessionReader;
import com.itechwx.ecommerce.auth.application.LegacySessionSnapshot;
import com.itechwx.ecommerce.auth.domain.ActorPrincipal;
import com.itechwx.ecommerce.auth.domain.AdminPrincipal;
import com.itechwx.ecommerce.auth.domain.ShopPrincipal;
import com.itechwx.ecommerce.auth.domain.UserPrincipal;
import com.itechwx.ecommerce.shared.config.EcommerceProperties;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;
import java.math.BigInteger;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPublicKey;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class LegacyAccessTokenAuthenticatorTest {

    private static final Instant NOW = Instant.parse("2026-06-29T12:00:00Z");
    private static final String ACCOUNT_ID = "account-fixture";
    private static final String DEVICE_ID = "web-browser-chrome";

    private LegacySessionReader sessionReader;
    private KeyPair keyPair;
    private LegacyAccessTokenAuthenticator authenticator;

    @BeforeEach
    void setUp() throws Exception {
        sessionReader = mock(LegacySessionReader.class);
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        keyPair = generator.generateKeyPair();
        authenticator = new LegacyAccessTokenAuthenticator(
                sessionReader,
                properties(),
                Clock.fixed(NOW, ZoneOffset.UTC)
        );
    }

    @Test
    void authenticatesLegacyPkcs1UserTokenWithServerPermissions() throws Exception {
        String token = rs256Token("USER", NOW.minusSeconds(5), NOW.plusSeconds(3600), keyPair);
        when(sessionReader.findActive(ACCOUNT_ID, DEVICE_ID, token))
                .thenReturn(Optional.of(session("USER", List.of("USER"),
                        List.of("user:read", "user:write"), false, keyPair)));

        ActorPrincipal actor = authenticator.authenticate(token);

        assertThat(actor).isInstanceOf(UserPrincipal.class);
        assertThat(actor.accountId()).isEqualTo(ACCOUNT_ID);
        assertThat(actor.permissions()).containsExactlyInAnyOrder("user:read", "user:write");
    }

    @Test
    void authenticatesShopAndSuperAdminAsDistinctPrincipals() throws Exception {
        String shopToken = rs256Token("SHOP", NOW.minusSeconds(5), NOW.plusSeconds(3600), keyPair);
        when(sessionReader.findActive(ACCOUNT_ID, DEVICE_ID, shopToken))
                .thenReturn(Optional.of(session("SHOP", List.of("SHOP"),
                        List.of("product:manage"), false, keyPair)));
        assertThat(authenticator.authenticate(shopToken)).isInstanceOf(ShopPrincipal.class);

        String adminToken = rs256Token("SUPER_ADMIN", NOW.minusSeconds(5), NOW.plusSeconds(3600), keyPair);
        when(sessionReader.findActive(ACCOUNT_ID, DEVICE_ID, adminToken))
                .thenReturn(Optional.of(session("SUPER_ADMIN", List.of("SUPER_ADMIN"),
                        List.of("platform:manage"), false, keyPair)));
        assertThat(authenticator.authenticate(adminToken)).isInstanceOf(AdminPrincipal.class);
    }

    @Test
    void rejectsHs256BeforeSessionLookup() throws Exception {
        SignedJWT jwt = new SignedJWT(
                new JWSHeader(JWSAlgorithm.HS256),
                claims("USER", NOW.minusSeconds(5), NOW.plusSeconds(3600))
        );
        jwt.sign(new MACSigner("01234567890123456789012345678901"));

        assertThatThrownBy(() -> authenticator.authenticate(jwt.serialize()))
                .isInstanceOf(LegacyAuthenticationException.class);
        verifyNoInteractions(sessionReader);
    }

    @Test
    void rejectsExpiredToken() throws Exception {
        String token = rs256Token("USER", NOW.minusSeconds(7200), NOW.minusSeconds(120), keyPair);
        when(sessionReader.findActive(ACCOUNT_ID, DEVICE_ID, token))
                .thenReturn(Optional.of(session("USER", List.of("USER"), List.of(), false, keyPair)));

        assertThatThrownBy(() -> authenticator.authenticate(token))
                .isInstanceOf(LegacyAuthenticationException.class);
    }

    @Test
    void rejectsRevokedOrMissingSession() throws Exception {
        String token = rs256Token("USER", NOW.minusSeconds(5), NOW.plusSeconds(3600), keyPair);
        when(sessionReader.findActive(anyString(), anyString(), anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authenticator.authenticate(token))
                .isInstanceOf(LegacyAuthenticationException.class);
    }

    @Test
    void rejectsRoleMismatch() throws Exception {
        String token = rs256Token("USER", NOW.minusSeconds(5), NOW.plusSeconds(3600), keyPair);
        when(sessionReader.findActive(ACCOUNT_ID, DEVICE_ID, token))
                .thenReturn(Optional.of(session("SHOP", List.of("SHOP"), List.of(), false, keyPair)));

        assertThatThrownBy(() -> authenticator.authenticate(token))
                .isInstanceOf(LegacyAuthenticationException.class);
    }

    @Test
    void rejectsRefreshTokenOnAccessPath() throws Exception {
        String token = rs256Token("USER", NOW.minusSeconds(5), NOW.plusSeconds(3600), keyPair);
        when(sessionReader.findActive(ACCOUNT_ID, DEVICE_ID, token))
                .thenReturn(Optional.of(session("USER", List.of("USER"), List.of(), true, keyPair)));

        assertThatThrownBy(() -> authenticator.authenticate(token))
                .isInstanceOf(LegacyAuthenticationException.class);
    }

    @Test
    void rejectsSignatureFromDifferentKey() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        KeyPair other = generator.generateKeyPair();
        String token = rs256Token("USER", NOW.minusSeconds(5), NOW.plusSeconds(3600), keyPair);
        when(sessionReader.findActive(ACCOUNT_ID, DEVICE_ID, token))
                .thenReturn(Optional.of(session("USER", List.of("USER"), List.of(), false, other)));

        assertThatThrownBy(() -> authenticator.authenticate(token))
                .isInstanceOf(LegacyAuthenticationException.class);
    }

    @Test
    void rejectsExpiredSessionKey() throws Exception {
        String token = rs256Token("USER", NOW.minusSeconds(5), NOW.plusSeconds(3600), keyPair);
        LegacySessionSnapshot expired = new LegacySessionSnapshot(
                "key-fixture",
                ACCOUNT_ID,
                DEVICE_ID,
                "fixture@example.test",
                "USER",
                pkcs1Pem((RSAPublicKey) keyPair.getPublic()),
                NOW.minusSeconds(1).toEpochMilli(),
                List.of("USER"),
                List.of(),
                false
        );
        when(sessionReader.findActive(ACCOUNT_ID, DEVICE_ID, token)).thenReturn(Optional.of(expired));

        assertThatThrownBy(() -> authenticator.authenticate(token))
                .isInstanceOf(LegacyAuthenticationException.class);
    }

    @Test
    void rejectsInvalidPersistedPermissionInsteadOfCreatingAnAuthority() throws Exception {
        String token = rs256Token("SHOP", NOW.minusSeconds(5), NOW.plusSeconds(3600), keyPair);
        when(sessionReader.findActive(ACCOUNT_ID, DEVICE_ID, token))
                .thenReturn(Optional.of(session("SHOP", List.of("SHOP"),
                        List.of("product:manage\nROLE_ADMIN"), false, keyPair)));

        assertThatThrownBy(() -> authenticator.authenticate(token))
                .isInstanceOf(LegacyAuthenticationException.class);
    }

    @Test
    void rejectsWeakLegacyRsaKey() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(1024);
        KeyPair weak = generator.generateKeyPair();
        String token = rs256Token("USER", NOW.minusSeconds(5), NOW.plusSeconds(3600), keyPair);
        when(sessionReader.findActive(ACCOUNT_ID, DEVICE_ID, token))
                .thenReturn(Optional.of(session("USER", List.of("USER"), List.of(), false, weak)));

        assertThatThrownBy(() -> authenticator.authenticate(token))
                .isInstanceOf(LegacyAuthenticationException.class);
    }

    @Test
    void rejectsOversizedTokenBeforeSessionLookup() {
        assertThatThrownBy(() -> authenticator.authenticate("x".repeat(8193)))
                .isInstanceOf(LegacyAuthenticationException.class);
        verifyNoInteractions(sessionReader);
    }

    private LegacySessionSnapshot session(
            String accountType,
            List<String> roles,
            List<String> permissions,
            boolean presentedIsRefresh,
            KeyPair publicKey
    ) {
        return new LegacySessionSnapshot(
                "key-fixture",
                ACCOUNT_ID,
                DEVICE_ID,
                "fixture@example.test",
                accountType,
                pkcs1Pem((RSAPublicKey) publicKey.getPublic()),
                NOW.plusSeconds(7200).toEpochMilli(),
                roles,
                permissions,
                presentedIsRefresh
        );
    }

    private String rs256Token(String role, Instant issuedAt, Instant expiresAt, KeyPair pair) throws Exception {
        SignedJWT jwt = new SignedJWT(
                new JWSHeader(JWSAlgorithm.RS256),
                claims(role, issuedAt, expiresAt)
        );
        jwt.sign(new RSASSASigner(pair.getPrivate()));
        return jwt.serialize();
    }

    private JWTClaimsSet claims(String role, Instant issuedAt, Instant expiresAt) {
        return new JWTClaimsSet.Builder()
                .claim("accountId", ACCOUNT_ID)
                .claim("deviceId", DEVICE_ID)
                .claim("email", "fixture@example.test")
                .claim("role", role)
                .issueTime(Date.from(issuedAt))
                .expirationTime(Date.from(expiresAt))
                .build();
    }

    private EcommerceProperties properties() {
        return new EcommerceProperties(
                new EcommerceProperties.Cors(List.of("http://localhost:3000")),
                new EcommerceProperties.Request("X-Request-Id", 2_097_152),
                new EcommerceProperties.Security(
                        "local-test", "ecommerce-api", "local-test-pepper-value-123456789", 8192, 60
                )
        );
    }

    private String pkcs1Pem(RSAPublicKey publicKey) {
        byte[] modulus = integer(publicKey.getModulus());
        byte[] exponent = integer(publicKey.getPublicExponent());
        ByteArrayOutputStream body = new ByteArrayOutputStream();
        body.writeBytes(modulus);
        body.writeBytes(exponent);
        ByteArrayOutputStream sequence = new ByteArrayOutputStream();
        sequence.write(0x30);
        writeLength(sequence, body.size());
        sequence.writeBytes(body.toByteArray());
        String encoded = Base64.getMimeEncoder(64, new byte[]{'\n'}).encodeToString(sequence.toByteArray());
        return "-----BEGIN RSA PUBLIC KEY-----\n" + encoded + "\n-----END RSA PUBLIC KEY-----";
    }

    private byte[] integer(BigInteger value) {
        byte[] bytes = value.toByteArray();
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        output.write(0x02);
        writeLength(output, bytes.length);
        output.writeBytes(bytes);
        return output.toByteArray();
    }

    private void writeLength(ByteArrayOutputStream output, int length) {
        if (length < 128) {
            output.write(length);
            return;
        }
        int bytes = (Integer.SIZE - Integer.numberOfLeadingZeros(length) + 7) / 8;
        output.write(0x80 | bytes);
        for (int shift = (bytes - 1) * 8; shift >= 0; shift -= 8) {
            output.write((length >> shift) & 0xff);
        }
    }
}
