package com.itechwx.ecommerce.auth.security;

import com.itechwx.ecommerce.auth.application.LegacySessionReader;
import com.itechwx.ecommerce.auth.application.LegacyCredentialReader;
import com.itechwx.ecommerce.auth.application.CredentialAttemptStore;
import com.itechwx.ecommerce.auth.application.AccountRegistrationService;
import com.itechwx.ecommerce.auth.application.GoogleOAuthLoginService;
import com.itechwx.ecommerce.auth.application.AuthLoginService;
import com.itechwx.ecommerce.auth.application.AuthSessionStore;
import com.itechwx.ecommerce.auth.application.RefreshTokenService;
import com.itechwx.ecommerce.auth.application.PasswordResetNotifier;
import com.itechwx.ecommerce.auth.application.PasswordResetService;
import com.itechwx.ecommerce.auth.config.PasswordResetProperties;
import com.itechwx.ecommerce.auth.infrastructure.JdbcAuthSessionStore;
import com.itechwx.ecommerce.auth.infrastructure.JdbcCredentialAttemptStore;
import com.itechwx.ecommerce.auth.infrastructure.JdbcAccountRegistrationService;
import com.itechwx.ecommerce.auth.infrastructure.JdbcGoogleOAuthLoginService;
import com.itechwx.ecommerce.auth.infrastructure.JdbcRefreshTokenService;
import com.itechwx.ecommerce.auth.infrastructure.JdbcPasswordResetService;
import com.itechwx.ecommerce.auth.infrastructure.SmtpPasswordResetNotifier;
import com.itechwx.ecommerce.auth.infrastructure.JdbcLegacyCredentialReader;
import com.itechwx.ecommerce.auth.infrastructure.JdbcLegacySessionReader;
import com.itechwx.ecommerce.shared.config.EcommerceProperties;
import com.itechwx.ecommerce.shared.error.ApiErrorWriter;
import com.itechwx.ecommerce.shared.security.SecurityFilterContributor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.mail.javamail.JavaMailSender;

import java.time.Clock;
import java.security.SecureRandom;

@Configuration(proxyBeanMethods = false)
public class LegacyAuthConfiguration {

    @Bean
    Clock authenticationClock() {
        return Clock.systemUTC();
    }

    @Bean
    LegacySessionReader legacySessionReader(NamedParameterJdbcTemplate jdbcTemplate) {
        return new JdbcLegacySessionReader(jdbcTemplate);
    }

    @Bean
    LegacyCredentialReader legacyCredentialReader(
            NamedParameterJdbcTemplate jdbcTemplate,
            Clock authenticationClock
    ) {
        return new JdbcLegacyCredentialReader(jdbcTemplate, authenticationClock);
    }

    @Bean
    CredentialAttemptStore credentialAttemptStore(
            NamedParameterJdbcTemplate jdbcTemplate,
            Clock authenticationClock
    ) {
        return new JdbcCredentialAttemptStore(jdbcTemplate, authenticationClock);
    }

    @Bean
    LegacyPasswordHasher legacyPasswordHasher() {
        return new LegacyPasswordHasher();
    }

    @Bean
    SecureRandom authenticationSecureRandom() {
        return new SecureRandom();
    }

    @Bean
    LegacyPasswordVerifier legacyPasswordVerifier(LegacyPasswordHasher passwordHasher) {
        return new LegacyPasswordVerifier(passwordHasher);
    }

    @Bean
    TokenDigester tokenDigester(EcommerceProperties properties) {
        return new TokenDigester(properties);
    }

    @Bean
    LegacyTokenIssuer legacyTokenIssuer(Clock authenticationClock, EcommerceProperties properties) {
        return new LegacyTokenIssuer(authenticationClock, properties);
    }

    @Bean
    LegacyRefreshTokenVerifier legacyRefreshTokenVerifier(
            Clock authenticationClock,
            EcommerceProperties properties
    ) {
        return new LegacyRefreshTokenVerifier(authenticationClock, properties);
    }

    @Bean
    LegacyCredentialAuthenticator legacyCredentialAuthenticator(
            LegacyCredentialReader credentialReader,
            LegacyPasswordVerifier passwordVerifier,
            CredentialAttemptStore attemptStore
    ) {
        return new LegacyCredentialAuthenticator(credentialReader, passwordVerifier, attemptStore);
    }

    @Bean
    AuthSessionStore authSessionStore(
            NamedParameterJdbcTemplate jdbcTemplate,
            TransactionTemplate transactionTemplate,
            Clock authenticationClock
    ) {
        return new JdbcAuthSessionStore(jdbcTemplate, transactionTemplate, authenticationClock);
    }

    @Bean
    AuthLoginService authLoginService(
            LegacyCredentialAuthenticator credentialAuthenticator,
            LegacyTokenIssuer tokenIssuer,
            TokenDigester tokenDigester,
            AuthSessionStore sessionStore
    ) {
        return new AuthLoginService(
                credentialAuthenticator,
                tokenIssuer,
                tokenDigester,
                sessionStore
        );
    }

    @Bean
    AccountRegistrationService accountRegistrationService(
            NamedParameterJdbcTemplate jdbcTemplate,
            TransactionTemplate transactionTemplate,
            LegacyPasswordHasher passwordHasher,
            LegacyTokenIssuer tokenIssuer,
            TokenDigester tokenDigester,
            AuthSessionStore sessionStore,
            SecureRandom authenticationSecureRandom,
            Clock authenticationClock
    ) {
        return new JdbcAccountRegistrationService(
                jdbcTemplate,
                transactionTemplate,
                passwordHasher,
                tokenIssuer,
                tokenDigester,
                sessionStore,
                authenticationSecureRandom,
                authenticationClock
        );
    }

    @Bean
    GoogleOAuthLoginService googleOAuthLoginService(
            NamedParameterJdbcTemplate jdbcTemplate,
            TransactionTemplate transactionTemplate,
            LegacyTokenIssuer tokenIssuer,
            TokenDigester tokenDigester,
            AuthSessionStore sessionStore,
            Clock authenticationClock
    ) {
        return new JdbcGoogleOAuthLoginService(
                jdbcTemplate,
                transactionTemplate,
                tokenIssuer,
                tokenDigester,
                sessionStore,
                authenticationClock
        );
    }

    @Bean
    RefreshTokenService refreshTokenService(
            NamedParameterJdbcTemplate jdbcTemplate,
            TransactionTemplate transactionTemplate,
            LegacyRefreshTokenVerifier refreshTokenVerifier,
            LegacyTokenIssuer tokenIssuer,
            TokenDigester tokenDigester,
            Clock authenticationClock
    ) {
        return new JdbcRefreshTokenService(
                jdbcTemplate,
                transactionTemplate,
                refreshTokenVerifier,
                tokenIssuer,
                tokenDigester,
                authenticationClock
        );
    }

    @Bean
    PasswordResetNotifier passwordResetNotifier(
            JavaMailSender mailSender,
            PasswordResetProperties properties
    ) {
        return new SmtpPasswordResetNotifier(mailSender, properties);
    }

    @Bean
    PasswordResetService passwordResetService(
            NamedParameterJdbcTemplate jdbcTemplate,
            TransactionTemplate transactionTemplate,
            TokenDigester tokenDigester,
            LegacyPasswordHasher passwordHasher,
            PasswordResetNotifier notifier,
            SecureRandom authenticationSecureRandom,
            Clock authenticationClock
    ) {
        return new JdbcPasswordResetService(
                jdbcTemplate,
                transactionTemplate,
                tokenDigester,
                passwordHasher,
                notifier,
                authenticationSecureRandom,
                authenticationClock
        );
    }

    @Bean
    LegacyAccessTokenAuthenticator legacyAccessTokenAuthenticator(
            LegacySessionReader sessionReader,
            EcommerceProperties properties,
            Clock authenticationClock
    ) {
        return new LegacyAccessTokenAuthenticator(sessionReader, properties, authenticationClock);
    }

    @Bean
    SecurityFilterContributor legacyAccessTokenFilterContributor(
            LegacyAccessTokenAuthenticator authenticator,
            ApiErrorWriter errorWriter
    ) {
        LegacyAccessTokenFilter filter = new LegacyAccessTokenFilter(authenticator, errorWriter);
        return http -> http.addFilterBefore(filter, AnonymousAuthenticationFilter.class);
    }
}
