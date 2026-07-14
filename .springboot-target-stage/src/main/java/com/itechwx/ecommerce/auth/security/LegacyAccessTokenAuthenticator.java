package com.itechwx.ecommerce.auth.security;

import com.itechwx.ecommerce.auth.application.LegacySessionReader;
import com.itechwx.ecommerce.auth.application.LegacySessionSnapshot;
import com.itechwx.ecommerce.auth.domain.ActorPrincipal;
import com.itechwx.ecommerce.auth.domain.ActorType;
import com.itechwx.ecommerce.auth.domain.AdminPrincipal;
import com.itechwx.ecommerce.auth.domain.ShopPrincipal;
import com.itechwx.ecommerce.auth.domain.UserPrincipal;
import com.itechwx.ecommerce.shared.config.EcommerceProperties;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.crypto.RSASSAVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

public final class LegacyAccessTokenAuthenticator {

    private static final Pattern AUTHORITY_VALUE = Pattern.compile("[A-Za-z0-9:_-]{1,100}");

    private final LegacySessionReader sessionReader;
    private final LegacyRsaPublicKeyParser publicKeyParser;
    private final Clock clock;
    private final int maxTokenBytes;
    private final long clockSkewSeconds;
    private final String issuer;
    private final String audience;

    public LegacyAccessTokenAuthenticator(
            LegacySessionReader sessionReader,
            EcommerceProperties properties,
            Clock clock
    ) {
        this.sessionReader = sessionReader;
        this.publicKeyParser = new LegacyRsaPublicKeyParser();
        this.clock = clock;
        this.maxTokenBytes = properties.security().legacyMaxTokenBytes();
        this.clockSkewSeconds = properties.security().clockSkewSeconds();
        this.issuer = properties.security().issuer();
        this.audience = properties.security().audience();
    }

    public ActorPrincipal authenticate(String token) {
        try {
            if (token == null
                    || token.isBlank()
                    || token.getBytes(StandardCharsets.US_ASCII).length > maxTokenBytes) {
                throw new LegacyAuthenticationException();
            }

            SignedJWT signedJwt = SignedJWT.parse(token);
            if (!JWSAlgorithm.RS256.equals(signedJwt.getHeader().getAlgorithm())) {
                throw new LegacyAuthenticationException();
            }

            JWTClaimsSet claims = signedJwt.getJWTClaimsSet();
            String accountId = requiredIdentifier(claims.getStringClaim("accountId"), 128);
            String deviceId = requiredIdentifier(claims.getStringClaim("deviceId"), 200);

            LegacySessionSnapshot session = sessionReader.findActive(accountId, deviceId, token)
                    .orElseThrow(LegacyAuthenticationException::new);
            if (!accountId.equals(session.accountId()) || !deviceId.equals(session.deviceId())) {
                throw new LegacyAuthenticationException();
            }
            if (!signedJwt.verify(new RSASSAVerifier(publicKeyParser.parse(session.publicKeyPem())))) {
                throw new LegacyAuthenticationException();
            }

            validateTimestamps(claims, session.keyExpiresAtEpochMillis());
            validatePurposeAndIdentity(claims);
            if (session.presentedTokenIsRefreshToken()) {
                throw new LegacyAuthenticationException();
            }

            ActorType actorType = parseActorType(session.accountType());
            String tokenRole = requiredAuthorityValue(claims.getStringClaim("role"));
            if (!actorType.name().equals(tokenRole)) {
                throw new LegacyAuthenticationException();
            }
            validatePersistedRoles(actorType, session.roles());
            Set<String> permissions = validatePermissions(session.permissions());

            return switch (actorType) {
                case USER -> new UserPrincipal(accountId, deviceId, session.email(), permissions);
                case SHOP -> new ShopPrincipal(accountId, deviceId, session.email(), permissions);
                case ADMIN, SUPER_ADMIN -> new AdminPrincipal(
                        accountId,
                        deviceId,
                        session.email(),
                        actorType,
                        permissions
                );
            };
        } catch (LegacyAuthenticationException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new LegacyAuthenticationException(exception);
        }
    }

    private void validatePurposeAndIdentity(JWTClaimsSet claims) {
        String tokenType = claims.getClaim("tokenType") instanceof String value ? value : null;
        if (tokenType == null) {
            return;
        }
        if (!"ACCESS".equals(tokenType)
                || !issuer.equals(claims.getIssuer())
                || !claims.getAudience().contains(audience)) {
            throw new LegacyAuthenticationException();
        }
    }

    private void validateTimestamps(JWTClaimsSet claims, Long keyExpiresAtEpochMillis) {
        Instant now = clock.instant();
        Date expiration = claims.getExpirationTime();
        Date issuedAt = claims.getIssueTime();
        if (expiration == null || issuedAt == null) {
            throw new LegacyAuthenticationException();
        }
        if (now.minusSeconds(clockSkewSeconds).isAfter(expiration.toInstant())) {
            throw new LegacyAuthenticationException();
        }
        if (issuedAt.toInstant().isAfter(now.plusSeconds(clockSkewSeconds))) {
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

    private ActorType parseActorType(String accountType) {
        try {
            return ActorType.valueOf(accountType.toUpperCase(Locale.ROOT));
        } catch (RuntimeException exception) {
            throw new LegacyAuthenticationException(exception);
        }
    }

    private void validatePersistedRoles(ActorType actorType, List<String> roles) {
        for (String role : roles) {
            String value = requiredAuthorityValue(role);
            if (value.equals(actorType.name())) {
                return;
            }
        }
        if (!roles.isEmpty()) {
            throw new LegacyAuthenticationException();
        }
    }

    private Set<String> validatePermissions(List<String> permissions) {
        Set<String> values = new HashSet<>();
        for (String permission : permissions) {
            values.add(requiredAuthorityValue(permission));
        }
        return Set.copyOf(values);
    }

    private String requiredAuthorityValue(String value) {
        if (value == null || !AUTHORITY_VALUE.matcher(value).matches()) {
            throw new LegacyAuthenticationException();
        }
        return value;
    }

    private String requiredIdentifier(String value, int maxLength) {
        if (value == null || value.isBlank() || value.length() > maxLength) {
            throw new LegacyAuthenticationException();
        }
        if (value.chars().anyMatch(character -> Character.isISOControl(character))) {
            throw new LegacyAuthenticationException();
        }
        return value;
    }
}
