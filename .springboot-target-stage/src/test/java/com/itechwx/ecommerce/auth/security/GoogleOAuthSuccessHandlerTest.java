package com.itechwx.ecommerce.auth.security;

import com.itechwx.ecommerce.auth.application.AccountIdentityResponse;
import com.itechwx.ecommerce.auth.application.GoogleOAuthLoginService;
import com.itechwx.ecommerce.auth.application.UserLoginResponse;
import com.itechwx.ecommerce.shared.error.ApiErrorWriter;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GoogleOAuthSuccessHandlerTest {

    @Test
    void issuesHttpOnlyCookiesWithoutWritingTokensIntoTheHtmlBody() throws Exception {
        GoogleOAuthLoginService loginService = mock(GoogleOAuthLoginService.class);
        ApiErrorWriter errorWriter = mock(ApiErrorWriter.class);
        OAuth2User oauthUser = mock(OAuth2User.class);
        when(oauthUser.getName()).thenReturn("provider-fixture");
        when(oauthUser.getAttributes()).thenReturn(Map.of(
                "email", "oauth@example.test",
                "name", "OAuth Fixture",
                "picture", "https://example.test/avatar.png",
                "email_verified", true
        ));
        when(loginService.login(
                "provider-fixture",
                "oauth@example.test",
                "OAuth Fixture",
                "https://example.test/avatar.png",
                true
        )).thenReturn(new UserLoginResponse(
                new AccountIdentityResponse("account-fixture"),
                "access-secret-fixture",
                "refresh-secret-fixture"
        ));
        OAuth2AuthenticationToken authentication = new OAuth2AuthenticationToken(
                oauthUser,
                List.of(),
                "google"
        );
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.getSession(true);
        MockHttpServletResponse response = new MockHttpServletResponse();

        new GoogleOAuthSuccessHandler(loginService, errorWriter)
                .onAuthenticationSuccess(request, response, authentication);

        assertThat(response.getHeaders("Set-Cookie"))
                .hasSize(2)
                .allMatch(cookie -> cookie.contains("HttpOnly") && cookie.contains("SameSite=Strict"));
        assertThat(response.getContentAsString())
                .contains("Authentication successful")
                .doesNotContain("access-secret-fixture", "refresh-secret-fixture");
        assertThat(request.getSession(false)).isNull();
    }
}
