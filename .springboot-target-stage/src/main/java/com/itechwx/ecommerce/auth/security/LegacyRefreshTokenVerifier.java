package com.itechwx.ecommerce.auth.security;

import com.itechwx.ecommerce.auth.application.RefreshTokenClaims;
import com.itechwx.ecommerce.auth.domain.ActorType;
import com.itechwx.ecommerce.shared.config.EcommerceProperties;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.crypto.RSASSAVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.util.Date;
import java.util.Locale;

public final class LegacyRefreshTokenVerifier {

    private final LegacyRsaPublicKeyParser publicKeyParser = new LegacyRsaPublicKeyParser();
    private final Clock clock;
    private final int maxTokenBytes;
    private final long clockSkewSeconds;
    private final String issuer;
    private final String audience;

    public LegacyRefreshTokenVerifier(
            Clock clock,
            EcommerceProperties properties
    ) {
        this.clock = clock;
        this.maxTokenBytes = properties.security().legacyMaxTokenBytes();
        this.clockSkewSeconds = properties.security().clockSkewSeconds();
        this.issuer = properties.security().issuer();
        this.audience = properties.security().audience();
    }

    public RefreshTokenClaims decodeUnverified(String token) {
        try {
            SignedJWT jwt = parse(token);
            return new RefreshTokenClaims(
                    requiredIdentifier(jwt.getJWTClaimsSet().getStringClaim("accountId"), 128),
                    requiredIdentifier(jwt.getJWTClaimsSet().getStringClaim("deviceId"), 200)
            );
        } catch (LegacyAuthenticationException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new LegacyAuthenticationException(exception);
        }
    }

    public void verify(
            String token,
            String publicKeyPem,
            Long keyExpiresAtEpochMillis,
            ActorType expectedActorType
    ) {
        try {
            SignedJWT jwt = parse(token);
            if (!jwt.verify(new RSASSAVerifier(publicKeyParser.parse(publicKeyPem)))) {
                throw new LegacyAuthenticationException();
            }
            JWTClaimsSet claims = jwt.getJWTClaimsSet();
            validateTimestamps(claims, keyExpiresAtEpochMillis);
            String tokenType = claims.getClaim("tokenType") instanceof String value ? value : null;
            if (tokenType != null && (!"REFRESH".equals(tokenType)
                    || !issuer.equals(claims.getIssuer())
                    || !claims.getAudience().contains(audience))) {
                throw new LegacyAuthenticationException();
            }
            String role = claims.getStringClaim("role");
            if (role == null
                    || expectedActorType != ActorType.valueOf(role.toUpperCase(Locale.ROOT))) {
                throw new LegacyAuthenticationException();
            }
        } catch (LegacyAuthenticationException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new LegacyAuthenticationException(exception);
        }
    }

    private SignedJWT parse(String token) throws java.text.ParseException {
        if (token == null
                || token.isBlank()
                || token.getBytes(StandardCharsets.US_ASCII).length > maxTokenBytes) {
            throw new LegacyAuthenticationException();
        }
        SignedJWT jwt = SignedJWT.parse(token);
        if (!JWSAlgorithm.RS256.equals(jwt.getHeader().getAlgorithm())) {
            throw new LegacyAuthenticationException();
        }
        return jwt;
    }

    private void validateTimestamps(JWTClaimsSet claims, Long keyExpiresAtEpochMillis) {
        Instant now = clock.instant();
        Date expiration = claims.getExpirationTime();
        Date issuedAt = claims.getIssueTime();
        if (expiration == null
                || issuedAt == null
                || now.minusSeconds(clockSkewSeconds).isAfter(expiration.toInstant())
                || issuedAt.toInstant().isAfter(now.plusSeconds(clockSkewSeconds))) {
            throw new LegacyAuthenticationException();
        }
        Date notBefore = claims.getNotBeforeTime();
        if (notBefore != null && notBefore.toInstant().isAfter(now.plusSeconds(clockSkewSeconds))) {
            throw new LegacyAuthenticationException();
        }
        if (keyExpiresAtEpochMillis != null && keyExpiresAtEpochMillis <= now.toEpochMilli()) {
            throw new LegacyAuthenticationException();
        }
    }

    private String requiredIdentifier(String value, int maxLength) {
        if (value == null
                || value.isBlank()
                || value.length() > maxLength
                || value.chars().anyMatch(Character::isISOControl)) {
            throw new LegacyAuthenticationException();
        }
        return value;
    }
}
