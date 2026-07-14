package com.itechwx.ecommerce.auth.security;

import com.itechwx.ecommerce.auth.application.GoogleOAuthLoginService;
import com.itechwx.ecommerce.auth.application.UserLoginResponse;
import com.itechwx.ecommerce.shared.error.ApiErrorWriter;
import com.itechwx.ecommerce.shared.error.ApplicationException;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;

public final class GoogleOAuthSuccessHandler implements AuthenticationSuccessHandler {

    private static final String SUCCESS_PAGE = """
            <!doctype html><html lang="en"><head><meta charset="utf-8">
            <meta name="robots" content="noindex"><title>Authentication successful</title>
            </head><body>Authentication successful. You may close this window.</body></html>
            """;

    private final GoogleOAuthLoginService loginService;
    private final ApiErrorWriter errorWriter;

    public GoogleOAuthSuccessHandler(
            GoogleOAuthLoginService loginService,
            ApiErrorWriter errorWriter
    ) {
        this.loginService = loginService;
        this.errorWriter = errorWriter;
    }

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException, ServletException {
        try {
            if (!(authentication instanceof OAuth2AuthenticationToken oauth)) {
                throw invalidIdentity();
            }
            Map<String, Object> attributes = oauth.getPrincipal().getAttributes();
            Object verifiedValue = attributes.get("email_verified");
            boolean emailVerified = Boolean.TRUE.equals(verifiedValue)
                    || "true".equalsIgnoreCase(String.valueOf(verifiedValue));
            UserLoginResponse login = loginService.login(
                    oauth.getPrincipal().getName(),
                    stringAttribute(attributes, "email"),
                    stringAttribute(attributes, "name"),
                    stringAttribute(attributes, "picture"),
                    emailVerified
            );
            boolean secure = request.isSecure();
            response.addHeader(HttpHeaders.SET_COOKIE, tokenCookie(
                    "access_token", login.accessToken(), Duration.ofHours(1), secure
            ).toString());
            response.addHeader(HttpHeaders.SET_COOKIE, tokenCookie(
                    "refresh_token", login.refreshToken(), Duration.ofHours(6), secure
            ).toString());
            invalidateHandshakeSession(request);
            response.setStatus(HttpStatus.OK.value());
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.setContentType(MediaType.TEXT_HTML_VALUE);
            response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store");
            response.getWriter().write(SUCCESS_PAGE);
        } catch (ApplicationException exception) {
            invalidateHandshakeSession(request);
            errorWriter.write(
                    request,
                    response,
                    exception.status(),
                    exception.code(),
                    exception.getMessage()
            );
        }
    }

    private ResponseCookie tokenCookie(
            String name,
            String value,
            Duration maxAge,
            boolean secure
    ) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(secure)
                .sameSite("Strict")
                .path("/")
                .maxAge(maxAge)
                .build();
    }

    private String stringAttribute(Map<String, Object> attributes, String name) {
        Object value = attributes.get(name);
        return value == null ? null : value.toString();
    }

    private void invalidateHandshakeSession(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
    }

    private ApplicationException invalidIdentity() {
        return new ApplicationException(
                HttpStatus.UNAUTHORIZED,
                "INVALID_OAUTH_IDENTITY",
                "The provider identity is invalid."
        );
    }
}
