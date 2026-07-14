package com.itechwx.ecommerce.auth.application;

import com.itechwx.ecommerce.auth.domain.ActorType;
import com.itechwx.ecommerce.auth.security.LegacyCredentialAuthenticator;
import com.itechwx.ecommerce.auth.security.LegacyTokenIssuer;
import com.itechwx.ecommerce.auth.security.TokenDigester;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthLoginServiceTest {

    @Test
    void dualWritesRawCompatibleTokenAndDigestThroughSessionStore() {
        LegacyCredentialAuthenticator credentials = mock(LegacyCredentialAuthenticator.class);
        LegacyTokenIssuer issuer = mock(LegacyTokenIssuer.class);
        TokenDigester digester = mock(TokenDigester.class);
        AuthSessionStore store = mock(AuthSessionStore.class);
        VerifiedCredential verified = new VerifiedCredential(
                "account-fixture", "fixture@example.test", ActorType.USER
        );
        IssuedTokenPair tokens = new IssuedTokenPair(
                "access-fixture", "refresh-fixture", "public-key-fixture", 123456789L
        );
        when(credentials.authenticate(
                org.mockito.ArgumentMatchers.eq("fixture@example.test"),
                org.mockito.ArgumentMatchers.any(char[].class),
                org.mockito.ArgumentMatchers.eq(ActorType.USER)
        )).thenReturn(verified);
        when(issuer.issue(verified, "device-fixture")).thenReturn(tokens);
        when(digester.digest("refresh-fixture")).thenReturn("digest-fixture");
        AuthLoginService service = new AuthLoginService(credentials, issuer, digester, store);

        UserLoginResponse response = service.loginUser(
                "fixture@example.test",
                "FixturePass123!",
                " device-fixture ",
                " Browser "
        );

        assertThat(response.user().id()).isEqualTo("account-fixture");
        assertThat(response.accessToken()).isEqualTo("access-fixture");
        assertThat(response.refreshToken()).isEqualTo("refresh-fixture");
        verify(store).persistLogin(
                verified,
                "device-fixture",
                "Browser",
                tokens,
                "digest-fixture"
        );
    }
}
