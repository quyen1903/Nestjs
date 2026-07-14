package com.itechwx.ecommerce.auth.security;

import java.security.MessageDigest;
import java.util.Arrays;
import java.util.HexFormat;

public final class LegacyPasswordVerifier {

    private final LegacyPasswordHasher passwordHasher;

    public LegacyPasswordVerifier() {
        this(new LegacyPasswordHasher());
    }

    public LegacyPasswordVerifier(LegacyPasswordHasher passwordHasher) {
        this.passwordHasher = passwordHasher;
    }

    public boolean matches(char[] password, String salt, String expectedHexHash) {
        if (password == null
                || password.length == 0
                || salt == null
                || expectedHexHash == null
                || expectedHexHash.length() != LegacyPasswordHasher.HASH_BYTES * 2) {
            return false;
        }

        byte[] expected;
        try {
            expected = HexFormat.of().parseHex(expectedHexHash);
        } catch (IllegalArgumentException exception) {
            return false;
        }

        byte[] candidate = null;
        try {
            candidate = HexFormat.of().parseHex(passwordHasher.hash(password, salt));
            return MessageDigest.isEqual(candidate, expected);
        } catch (IllegalArgumentException exception) {
            return false;
        } finally {
            if (candidate != null) {
                Arrays.fill(candidate, (byte) 0);
            }
            Arrays.fill(expected, (byte) 0);
        }
    }
}
