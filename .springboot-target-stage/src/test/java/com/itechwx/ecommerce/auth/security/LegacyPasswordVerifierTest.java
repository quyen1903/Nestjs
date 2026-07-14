package com.itechwx.ecommerce.auth.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class LegacyPasswordVerifierTest {

    private static final String NODE_25_HASH =
            "8cce75b4630dee810ec38d6e98927058de043df00e9865f32ec86d0d6644d4bde"
                    + "c8fc55fb491bf1c9b61fcf723909b3e0c0703e762a74ef624e44eaa63549400";

    @Test
    void matchesExactSyntheticNode25Argon2idVectorAndRejectsWrongPassword() {
        LegacyPasswordVerifier verifier = new LegacyPasswordVerifier();

        assertThat(verifier.matches(
                "FixturePass123!".toCharArray(),
                "fixture-salt-2026",
                NODE_25_HASH
        )).isTrue();
        assertThat(verifier.matches(
                "WrongPass123!".toCharArray(),
                "fixture-salt-2026",
                NODE_25_HASH
        )).isFalse();
    }

    @Test
    void rejectsMalformedLegacyMaterialWithoutThrowing() {
        LegacyPasswordVerifier verifier = new LegacyPasswordVerifier();

        assertThat(verifier.matches("password".toCharArray(), "salt", "not-hex")).isFalse();
        assertThat(verifier.matches(new char[0], "salt", NODE_25_HASH)).isFalse();
    }
}
