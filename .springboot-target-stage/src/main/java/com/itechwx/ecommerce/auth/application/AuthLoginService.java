package com.itechwx.ecommerce.auth.application;

import com.itechwx.ecommerce.auth.domain.ActorType;
import com.itechwx.ecommerce.auth.security.LegacyCredentialAuthenticator;
import com.itechwx.ecommerce.auth.security.LegacyTokenIssuer;
import com.itechwx.ecommerce.auth.security.TokenDigester;

import java.util.Arrays;
import java.util.UUID;

public final class AuthLoginService {

    private final LegacyCredentialAuthenticator credentialAuthenticator;
    private final LegacyTokenIssuer tokenIssuer;
    private final TokenDigester tokenDigester;
    private final AuthSessionStore sessionStore;

    public AuthLoginService(
            LegacyCredentialAuthenticator credentialAuthenticator,
            LegacyTokenIssuer tokenIssuer,
            TokenDigester tokenDigester,
            AuthSessionStore sessionStore
    ) {
        this.credentialAuthenticator = credentialAuthenticator;
        this.tokenIssuer = tokenIssuer;
        this.tokenDigester = tokenDigester;
        this.sessionStore = sessionStore;
    }

    public UserLoginResponse loginUser(
            String email,
            String password,
            String requestedDeviceId,
            String deviceName
    ) {
        LoginResult login = login(email, password, requestedDeviceId, deviceName, ActorType.USER);
        return new UserLoginResponse(
                new AccountIdentityResponse(login.accountId()),
                login.tokens().accessToken(),
                login.tokens().refreshToken()
        );
    }

    public ShopLoginResponse loginShop(
            String email,
            String password,
            String requestedDeviceId,
            String deviceName
    ) {
        LoginResult login = login(email, password, requestedDeviceId, deviceName, ActorType.SHOP);
        return new ShopLoginResponse(
                new AccountIdentityResponse(login.accountId()),
                login.tokens().accessToken(),
                login.tokens().refreshToken()
        );
    }

    private LoginResult login(
            String email,
            String password,
            String requestedDeviceId,
            String deviceName,
            ActorType actorType
    ) {
        char[] passwordCharacters = password.toCharArray();
        try {
            VerifiedCredential credential = credentialAuthenticator.authenticate(
                    email,
                    passwordCharacters,
                    actorType
            );
            String deviceId = normalizedDeviceId(requestedDeviceId);
            IssuedTokenPair tokens = tokenIssuer.issue(credential, deviceId);
            sessionStore.persistLogin(
                    credential,
                    deviceId,
                    normalizeOptional(deviceName),
                    tokens,
                    tokenDigester.digest(tokens.refreshToken())
            );
            return new LoginResult(credential.accountId(), tokens);
        } finally {
            Arrays.fill(passwordCharacters, '\0');
        }
    }

    private String normalizedDeviceId(String requestedDeviceId) {
        String normalized = normalizeOptional(requestedDeviceId);
        return normalized == null ? UUID.randomUUID().toString() : normalized;
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private record LoginResult(String accountId, IssuedTokenPair tokens) {
    }
}
