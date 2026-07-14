package com.itechwx.ecommerce.auth.security;

import com.itechwx.ecommerce.auth.application.GoogleOAuthLoginService;
import com.itechwx.ecommerce.auth.config.GoogleOAuthProperties;
import com.itechwx.ecommerce.shared.error.ApiErrorWriter;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.config.oauth2.client.CommonOAuth2Provider;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.web.SecurityFilterChain;

@Configuration(proxyBeanMethods = false)
@ConditionalOnProperty(name = "ecommerce.google-oauth.enabled", havingValue = "true")
public class GoogleOAuthConfiguration {

    @Bean
    ClientRegistrationRepository googleClientRegistrationRepository(
            GoogleOAuthProperties properties
    ) {
        requireConfigured(properties.clientId(), "GOOGLE_CLIENT_ID");
        requireConfigured(properties.clientSecret(), "GOOGLE_CLIENT_SECRET");
        requireConfigured(properties.redirectUri(), "GOOGLE_CALLBACK_URL");
        ClientRegistration google = CommonOAuth2Provider.GOOGLE.getBuilder("google")
                .clientId(properties.clientId())
                .clientSecret(properties.clientSecret())
                .scope("openid", "email", "profile")
                .redirectUri(properties.redirectUri())
                .build();
        return new InMemoryClientRegistrationRepository(google);
    }

    @Bean
    GoogleOAuthSuccessHandler googleOAuthSuccessHandler(
            GoogleOAuthLoginService loginService,
            ApiErrorWriter errorWriter
    ) {
        return new GoogleOAuthSuccessHandler(loginService, errorWriter);
    }

    @Bean
    @Order(1)
    SecurityFilterChain googleOAuthSecurityFilterChain(
            HttpSecurity http,
            GoogleOAuthSuccessHandler successHandler,
            ApiErrorWriter errorWriter
    ) throws Exception {
        return http
                .securityMatcher("/auth/auth/google", "/auth/auth/google/callback")
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .authorizeHttpRequests(authorize -> authorize.anyRequest().permitAll())
                .oauth2Login(oauth -> oauth
                        .authorizationEndpoint(endpoint -> endpoint.baseUri("/auth/auth"))
                        .redirectionEndpoint(endpoint -> endpoint.baseUri("/auth/auth/google/callback"))
                        .successHandler(successHandler)
                        .failureHandler((request, response, exception) -> {
                            if (request.getSession(false) != null) {
                                request.getSession(false).invalidate();
                            }
                            errorWriter.write(
                                    request,
                                    response,
                                    HttpStatus.UNAUTHORIZED,
                                    "OAUTH_LOGIN_FAILED",
                                    "Google sign-in failed."
                            );
                        })
                )
                .build();
    }

    private void requireConfigured(String value, String name) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(name + " is required when Google OAuth is enabled");
        }
    }
}
