package com.itechwx.ecommerce.auth.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.itechwx.ecommerce.auth.domain.UserPrincipal;
import com.itechwx.ecommerce.shared.error.ApiErrorWriter;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class LegacyAccessTokenFilterTest {

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void installsExplicitActorAndServerAuthoritiesWithoutKeepingTokenCredentials() throws Exception {
        LegacyAccessTokenAuthenticator authenticator = mock(LegacyAccessTokenAuthenticator.class);
        when(authenticator.authenticate("access-token-fixture")).thenReturn(new UserPrincipal(
                "account-fixture",
                "device-fixture",
                "fixture@example.test",
                Set.of("user:read")
        ));
        LegacyAccessTokenFilter filter = filter(authenticator);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/protected");
        request.addHeader("Authorization", "Bearer access-token-fixture");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicReference<Authentication> observed = new AtomicReference<>();
        FilterChain chain = (servletRequest, servletResponse) ->
                observed.set(SecurityContextHolder.getContext().getAuthentication());

        filter.doFilter(request, response, chain);

        assertThat(observed.get().getPrincipal()).isInstanceOf(UserPrincipal.class);
        assertThat(observed.get().getCredentials()).isNull();
        assertThat(observed.get().getAuthorities())
                .extracting(Object::toString)
                .containsExactlyInAnyOrder("ROLE_USER", "PERMISSION_user:read");
    }

    @Test
    void returnsSameSafeUnauthorizedBodyForMalformedAndInvalidTokens() throws Exception {
        LegacyAccessTokenAuthenticator authenticator = mock(LegacyAccessTokenAuthenticator.class);
        when(authenticator.authenticate("invalid")).thenThrow(new LegacyAuthenticationException());
        LegacyAccessTokenFilter filter = filter(authenticator);

        MockHttpServletResponse malformed = execute(filter, "Basic not-supported");
        MockHttpServletResponse invalid = execute(filter, "Bearer invalid");

        assertThat(malformed.getStatus()).isEqualTo(401);
        assertThat(invalid.getStatus()).isEqualTo(401);
        assertThat(malformed.getContentAsString()).contains("INVALID_ACCESS_TOKEN").doesNotContain("not-supported");
        assertThat(invalid.getContentAsString()).contains("INVALID_ACCESS_TOKEN").doesNotContain("invalid\"");
    }

    private MockHttpServletResponse execute(LegacyAccessTokenFilter filter, String authorization) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/protected");
        request.addHeader("Authorization", authorization);
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, (servletRequest, servletResponse) -> { });
        return response;
    }

    private LegacyAccessTokenFilter filter(LegacyAccessTokenAuthenticator authenticator) {
        return new LegacyAccessTokenFilter(authenticator, new ApiErrorWriter(new ObjectMapper().findAndRegisterModules()));
    }
}
