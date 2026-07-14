package com.itechwx.ecommerce.auth.security;

import com.itechwx.ecommerce.shared.config.EcommerceProperties;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.util.HexFormat;

public final class TokenDigester {

    private static final String ALGORITHM = "HmacSHA256";

    private final SecretKeySpec key;

    public TokenDigester(EcommerceProperties properties) {
        this.key = new SecretKeySpec(
                properties.security().tokenDigestPepper().getBytes(StandardCharsets.UTF_8),
                ALGORITHM
        );
    }

    public String digest(String token) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Token is required");
        }
        try {
            Mac mac = Mac.getInstance(ALGORITHM);
            mac.init(key);
            return HexFormat.of().formatHex(mac.doFinal(token.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("HMAC-SHA-256 is unavailable", exception);
        }
    }

    public boolean matches(String expectedHexDigest, String token) {
        if (expectedHexDigest == null || expectedHexDigest.length() != 64) {
            return false;
        }
        try {
            return MessageDigest.isEqual(
                    HexFormat.of().parseHex(expectedHexDigest),
                    HexFormat.of().parseHex(digest(token))
            );
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }
}
