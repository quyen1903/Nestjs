package com.itechwx.ecommerce.auth.security;

import org.bouncycastle.crypto.generators.Argon2BytesGenerator;
import org.bouncycastle.crypto.params.Argon2Parameters;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HexFormat;

public final class LegacyPasswordHasher {

    static final int HASH_BYTES = 64;
    private static final int MEMORY_KIB = 65_536;
    private static final int ITERATIONS = 3;
    private static final int PARALLELISM = 4;
    private static final int MAX_PASSWORD_CHARACTERS = 1024;
    private static final int MAX_SALT_BYTES = 1024;

    public String hash(char[] value, String salt) {
        if (value == null || value.length == 0 || value.length > MAX_PASSWORD_CHARACTERS) {
            throw new IllegalArgumentException("Value length is invalid");
        }
        if (salt == null) {
            throw new IllegalArgumentException("Salt is required");
        }
        byte[] saltBytes = salt.getBytes(StandardCharsets.UTF_8);
        if (saltBytes.length == 0 || saltBytes.length > MAX_SALT_BYTES) {
            throw new IllegalArgumentException("Salt length is invalid");
        }

        byte[] output = new byte[HASH_BYTES];
        try {
            Argon2Parameters parameters = new Argon2Parameters.Builder(Argon2Parameters.ARGON2_id)
                    .withVersion(Argon2Parameters.ARGON2_VERSION_13)
                    .withSalt(saltBytes)
                    .withMemoryAsKB(MEMORY_KIB)
                    .withIterations(ITERATIONS)
                    .withParallelism(PARALLELISM)
                    .build();
            Argon2BytesGenerator generator = new Argon2BytesGenerator();
            generator.init(parameters);
            generator.generateBytes(value, output);
            return HexFormat.of().formatHex(output);
        } finally {
            Arrays.fill(output, (byte) 0);
            Arrays.fill(saltBytes, (byte) 0);
        }
    }
}
