package com.itechwx.ecommerce.auth.security;

import com.itechwx.ecommerce.auth.application.IssuedTokenPair;
import com.itechwx.ecommerce.auth.application.VerifiedCredential;
import com.itechwx.ecommerce.auth.domain.ActorType;
import com.itechwx.ecommerce.shared.config.EcommerceProperties;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;

import java.io.ByteArrayOutputStream;
import java.math.BigInteger;
import java.security.GeneralSecurityException;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPublicKey;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.List;

public final class LegacyTokenIssuer {

    private static final Duration ACCESS_LIFETIME = Duration.ofHours(1);
    private static final Duration REFRESH_LIFETIME = Duration.ofHours(6);

    private final Clock clock;
    private final String issuer;
    private final String audience;

    public LegacyTokenIssuer(Clock clock, EcommerceProperties properties) {
        this.clock = clock;
        this.issuer = properties.security().issuer();
        this.audience = properties.security().audience();
    }

    public IssuedTokenPair issue(VerifiedCredential credential, String deviceId) {
        try {
            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(2048);
            KeyPair keyPair = generator.generateKeyPair();
            Instant issuedAt = clock.instant();
            Instant accessExpiresAt = issuedAt.plus(ACCESS_LIFETIME);
            Instant refreshExpiresAt = issuedAt.plus(REFRESH_LIFETIME);

            String accessToken = sign(
                    credential, deviceId, "ACCESS", issuedAt, accessExpiresAt, keyPair
            );
            String refreshToken = sign(
                    credential, deviceId, "REFRESH", issuedAt, refreshExpiresAt, keyPair
            );
            return new IssuedTokenPair(
                    accessToken,
                    refreshToken,
                    pkcs1Pem((RSAPublicKey) keyPair.getPublic()),
                    refreshExpiresAt.toEpochMilli()
            );
        } catch (GeneralSecurityException | JOSEException exception) {
            throw new IllegalStateException("Token issuance failed", exception);
        }
    }

    private String sign(
            VerifiedCredential credential,
            String deviceId,
            String tokenType,
            Instant issuedAt,
            Instant expiresAt,
            KeyPair keyPair
    ) throws JOSEException {
        JWTClaimsSet.Builder claims = new JWTClaimsSet.Builder()
                .issuer(issuer)
                .audience(audience)
                .claim("accountId", credential.accountId())
                .claim("deviceId", deviceId)
                .claim("email", credential.email())
                .claim("role", credential.actorType().name())
                .claim("tokenType", tokenType)
                .issueTime(Date.from(issuedAt))
                .expirationTime(Date.from(expiresAt));
        if (credential.actorType() == ActorType.SHOP) {
            claims.claim("permissions", List.of("order:read", "order:write"));
        }

        SignedJWT jwt = new SignedJWT(
                new JWSHeader.Builder(JWSAlgorithm.RS256).type(com.nimbusds.jose.JOSEObjectType.JWT).build(),
                claims.build()
        );
        jwt.sign(new RSASSASigner(keyPair.getPrivate()));
        return jwt.serialize();
    }

    private String pkcs1Pem(RSAPublicKey publicKey) {
        byte[] modulus = derInteger(publicKey.getModulus());
        byte[] exponent = derInteger(publicKey.getPublicExponent());
        ByteArrayOutputStream body = new ByteArrayOutputStream();
        body.writeBytes(modulus);
        body.writeBytes(exponent);
        ByteArrayOutputStream sequence = new ByteArrayOutputStream();
        sequence.write(0x30);
        writeLength(sequence, body.size());
        sequence.writeBytes(body.toByteArray());
        String encoded = Base64.getMimeEncoder(64, new byte[]{'\n'})
                .encodeToString(sequence.toByteArray());
        return "-----BEGIN RSA PUBLIC KEY-----\n" + encoded + "\n-----END RSA PUBLIC KEY-----";
    }

    private byte[] derInteger(BigInteger value) {
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
