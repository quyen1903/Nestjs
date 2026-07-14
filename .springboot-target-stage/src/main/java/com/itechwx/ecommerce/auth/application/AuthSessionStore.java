package com.itechwx.ecommerce.auth.application;

public interface AuthSessionStore {

    void persistLogin(
            VerifiedCredential credential,
            String deviceId,
            String deviceName,
            IssuedTokenPair tokens,
            String refreshTokenDigest
    );

    int revoke(String accountId, String deviceId);
}
