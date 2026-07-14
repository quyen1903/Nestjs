package com.itechwx.ecommerce.auth.infrastructure;

import com.itechwx.ecommerce.auth.application.AuthLoginService;
import com.itechwx.ecommerce.auth.application.ShopRegistrationCommand;
import com.itechwx.ecommerce.auth.application.UserRegistrationCommand;
import com.itechwx.ecommerce.auth.application.PasswordResetService;
import com.itechwx.ecommerce.auth.application.RefreshTokenResponse;
import com.itechwx.ecommerce.auth.application.UserLoginResponse;
import com.itechwx.ecommerce.auth.domain.ActorType;
import com.itechwx.ecommerce.auth.domain.UserPrincipal;
import com.itechwx.ecommerce.auth.security.LegacyAccessTokenAuthenticator;
import com.itechwx.ecommerce.auth.security.LegacyCredentialAuthenticator;
import com.itechwx.ecommerce.auth.security.LegacyPasswordHasher;
import com.itechwx.ecommerce.auth.security.LegacyPasswordVerifier;
import com.itechwx.ecommerce.auth.security.LegacyRefreshTokenVerifier;
import com.itechwx.ecommerce.auth.security.LegacyTokenIssuer;
import com.itechwx.ecommerce.auth.security.TokenDigester;
import com.itechwx.ecommerce.shared.config.EcommerceProperties;
import com.itechwx.ecommerce.shared.error.ApplicationException;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import javax.sql.DataSource;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@EnabledIfEnvironmentVariable(named = "MIGRATION_TEST_DB_URL", matches = ".+")
class LocalPostgresCompatibilityTest {

    private static final String NODE_25_HASH =
            "8cce75b4630dee810ec38d6e98927058de043df00e9865f32ec86d0d6644d4bde"
                    + "c8fc55fb491bf1c9b61fcf723909b3e0c0703e762a74ef624e44eaa63549400";

    @Test
    void verifiesFlywayLoginAccessRefreshReuseLogoutAndResetAgainstDisposablePostgres() {
        DataSource dataSource = org.springframework.boot.jdbc.DataSourceBuilder.create()
                .url(System.getenv("MIGRATION_TEST_DB_URL"))
                .username(System.getenv("MIGRATION_TEST_DB_USERNAME"))
                .password(System.getenv("MIGRATION_TEST_DB_PASSWORD"))
                .build();
        assertThat(Flyway.configure().dataSource(dataSource)
                .locations("classpath:db/migration").load().migrate().migrationsExecuted).isEqualTo(4);

        JdbcTemplate jdbc = new JdbcTemplate(dataSource);
        NamedParameterJdbcTemplate namedJdbc = new NamedParameterJdbcTemplate(dataSource);
        TransactionTemplate transactions = new TransactionTemplate(new DataSourceTransactionManager(dataSource));
        Clock clock = Clock.fixed(Instant.parse("2026-06-29T12:00:00Z"), ZoneOffset.UTC);
        EcommerceProperties properties = properties();
        TokenDigester digester = new TokenDigester(properties);
        LegacyPasswordHasher hasher = new LegacyPasswordHasher();
        LegacyTokenIssuer issuer = new LegacyTokenIssuer(clock, properties);

        insertUser(jdbc);
        JdbcAuthSessionStore sessionStore = new JdbcAuthSessionStore(
                namedJdbc, transactions, clock
        );
        JdbcAccountRegistrationService registrationService = new JdbcAccountRegistrationService(
                namedJdbc,
                transactions,
                hasher,
                issuer,
                digester,
                sessionStore,
                new SecureRandom(),
                clock
        );
        var registeredUser = registrationService.registerUser(userRegistration("registered@example.test"));
        var registeredShop = registrationService.registerShop(shopRegistration("shop@example.test"));
        assertThat(registeredUser.user().id()).isNotBlank();
        assertThat(registeredUser.notificationThread().id()).isNotBlank();
        assertThat(registeredShop.shop().id()).isNotBlank();
        assertThat(jdbc.queryForObject(
                "SELECT count(*) FROM account_profiles WHERE \"accountId\" IN (?, ?)",
                Integer.class,
                registeredUser.user().id(),
                registeredShop.shop().id()
        )).isEqualTo(2);
        assertThat(jdbc.queryForObject(
                "SELECT count(*) FROM shop_business WHERE \"accountId\" = ?",
                Integer.class,
                registeredShop.shop().id()
        )).isEqualTo(1);
        assertThatThrownBy(() -> registrationService.registerUser(
                userRegistration("REGISTERED@example.test")
        )).isInstanceOf(ApplicationException.class)
                .extracting(exception -> ((ApplicationException) exception).code())
                .isEqualTo("ACCOUNT_ALREADY_EXISTS");

        JdbcGoogleOAuthLoginService googleOAuth = new JdbcGoogleOAuthLoginService(
                namedJdbc,
                transactions,
                issuer,
                digester,
                sessionStore,
                clock
        );
        var oauthUser = googleOAuth.login(
                "google-provider-fixture",
                "oauth@example.test",
                "OAuth Fixture",
                "https://example.test/avatar.png",
                true
        );
        assertThat(googleOAuth.login(
                "google-provider-fixture",
                "oauth@example.test",
                "OAuth Fixture",
                null,
                true
        ).user().id()).isEqualTo(oauthUser.user().id());
        assertThat(jdbc.queryForObject("""
                SELECT access_token IS NULL AND refresh_token IS NULL
                  FROM social_authentication
                 WHERE provider = 'google' AND provider_id = 'google-provider-fixture'
                """, Boolean.class)).isTrue();
        assertThat(googleOAuth.login(
                "google-link-fixture",
                "registered@example.test",
                "Registered User",
                null,
                true
        ).user().id()).isEqualTo(registeredUser.user().id());
        assertThat(jdbc.queryForObject("""
                SELECT auth_method::text FROM account_authentication WHERE "accountId" = ?
                """, String.class, registeredUser.user().id())).isEqualTo("HYBRID");
        assertThatThrownBy(() -> googleOAuth.login(
                "google-unverified-fixture",
                "unverified@example.test",
                "Unverified",
                null,
                false
        )).isInstanceOf(ApplicationException.class)
                .extracting(exception -> ((ApplicationException) exception).code())
                .isEqualTo("OAUTH_EMAIL_NOT_VERIFIED");
        assertThatThrownBy(() -> googleOAuth.login(
                "google-shop-conflict",
                "shop@example.test",
                "Wrong Actor",
                null,
                true
        )).isInstanceOf(ApplicationException.class)
                .extracting(exception -> ((ApplicationException) exception).code())
                .isEqualTo("OAUTH_ACCOUNT_TYPE_CONFLICT");

        JdbcCredentialAttemptStore attemptStore = new JdbcCredentialAttemptStore(namedJdbc, clock);
        LegacyCredentialAuthenticator credentialAuthenticator = new LegacyCredentialAuthenticator(
                new JdbcLegacyCredentialReader(namedJdbc, clock),
                new LegacyPasswordVerifier(hasher),
                attemptStore
        );
        AuthLoginService loginService = new AuthLoginService(
                credentialAuthenticator,
                issuer,
                digester,
                sessionStore
        );

        UserLoginResponse login = loginService.loginUser(
                "FIXTURE@EXAMPLE.TEST",
                "FixturePass123!",
                "device-fixture",
                "Local PostgreSQL fixture"
        );
        LegacyAccessTokenAuthenticator accessAuthenticator = new LegacyAccessTokenAuthenticator(
                new JdbcLegacySessionReader(namedJdbc),
                properties,
                clock
        );
        assertThat(accessAuthenticator.authenticate(login.accessToken()))
                .isInstanceOf(UserPrincipal.class);
        assertThat(jdbc.queryForObject(
                "SELECT refresh_token_digest IS NOT NULL FROM key_tokens WHERE auth_id = 'account-fixture'",
                Boolean.class
        )).isTrue();

        JdbcRefreshTokenService refreshService = new JdbcRefreshTokenService(
                namedJdbc,
                transactions,
                new LegacyRefreshTokenVerifier(clock, properties),
                issuer,
                digester,
                clock
        );
        RefreshTokenResponse rotated = refreshService.refresh(login.refreshToken(), ActorType.USER);
        assertThat(rotated.refreshToken()).isNotEqualTo(login.refreshToken());
        assertThatThrownBy(() -> refreshService.refresh(login.refreshToken(), ActorType.USER))
                .isInstanceOf(ApplicationException.class)
                .extracting(exception -> ((ApplicationException) exception).code())
                .isEqualTo("REFRESH_TOKEN_REUSE");

        UserLoginResponse secondLogin = loginService.loginUser(
                "fixture@example.test",
                "FixturePass123!",
                "device-fixture",
                "Local PostgreSQL fixture"
        );
        assertThat(sessionStore.revoke("account-fixture", "device-fixture")).isEqualTo(1);
        assertThatThrownBy(() -> accessAuthenticator.authenticate(secondLogin.accessToken()))
                .isInstanceOf(org.springframework.security.core.AuthenticationException.class);

        loginService.loginUser(
                "fixture@example.test",
                "FixturePass123!",
                "device-fixture",
                "Local PostgreSQL fixture"
        );
        AtomicReference<String> deliveredToken = new AtomicReference<>();
        PasswordResetService resetService = new JdbcPasswordResetService(
                namedJdbc,
                transactions,
                digester,
                hasher,
                (recipient, token) -> deliveredToken.set(token),
                new SecureRandom(),
                clock
        );
        assertThat(resetService.request("fixture@example.test"))
                .isEqualTo(JdbcPasswordResetService.GENERIC_MESSAGE);
        assertThat(resetService.validate(deliveredToken.get())).isTrue();
        resetService.reset(deliveredToken.get(), "NextPass1!");
        assertThat(resetService.validate(deliveredToken.get())).isFalse();
        assertThat(jdbc.queryForObject(
                "SELECT count(*) FROM key_tokens WHERE auth_id = 'account-fixture' AND is_active = true",
                Integer.class
        )).isZero();

        UserLoginResponse concurrencyLogin = loginService.loginUser(
                "fixture@example.test",
                "NextPass1!",
                "device-fixture",
                "Local PostgreSQL concurrency fixture"
        );
        Callable<String> concurrentRefresh = () -> {
            try {
                refreshService.refresh(concurrencyLogin.refreshToken(), ActorType.USER);
                return "SUCCESS";
            } catch (ApplicationException exception) {
                return exception.code();
            }
        };
        try (var executor = Executors.newFixedThreadPool(2)) {
            List<String> results = executor.invokeAll(List.of(concurrentRefresh, concurrentRefresh)).stream()
                    .map(future -> {
                        try {
                            return future.get();
                        } catch (Exception exception) {
                            throw new AssertionError(exception);
                        }
                    })
                    .toList();
            assertThat(results).containsExactlyInAnyOrder("SUCCESS", "REFRESH_TOKEN_REUSE");
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new AssertionError(exception);
        }
        assertThat(jdbc.queryForObject(
                "SELECT count(*) FROM key_tokens WHERE auth_id = 'account-fixture' AND is_active = true",
                Integer.class
        )).isZero();

        for (int attempt = 0; attempt < JdbcCredentialAttemptStore.LOCKOUT_THRESHOLD; attempt++) {
            assertThatThrownBy(() -> credentialAuthenticator.authenticate(
                    "fixture@example.test",
                    "WrongPass123!".toCharArray(),
                    ActorType.USER
            )).isInstanceOf(com.itechwx.ecommerce.auth.security.LegacyCredentialException.class);
        }
        assertThat(jdbc.queryForObject(
                "SELECT failed_login_attempts FROM account_security WHERE \"accountId\" = 'account-fixture'",
                Integer.class
        )).isEqualTo(JdbcCredentialAttemptStore.LOCKOUT_THRESHOLD);
        assertThat(jdbc.queryForObject(
                "SELECT locked_until > ? FROM account_security WHERE \"accountId\" = 'account-fixture'",
                Boolean.class,
                clock.millis()
        )).isTrue();
        assertThatThrownBy(() -> credentialAuthenticator.authenticate(
                "fixture@example.test",
                "NextPass1!".toCharArray(),
                ActorType.USER
        )).isInstanceOf(com.itechwx.ecommerce.auth.security.LegacyCredentialException.class);
    }

    private void insertUser(JdbcTemplate jdbc) {
        jdbc.update("""
                INSERT INTO accounts(id, account_type, status, is_active, created_at, updated_at)
                VALUES ('account-fixture', 'USER'::"AccountType", 'ACTIVE'::"Status", true, 0, 0)
                """);
        jdbc.update("""
                INSERT INTO account_authentication(
                    "accountId", email, password_hash, password_salt,
                    is_active, created_at, updated_at
                ) VALUES (
                    'account-fixture', 'fixture@example.test', ?, 'fixture-salt-2026', true, 0, 0
                )
                """, NODE_25_HASH);
        jdbc.update("""
                INSERT INTO account_security(
                    "accountId", roles, permissions, backup_codes, created_at, updated_at
                ) VALUES (
                    'account-fixture', ARRAY['USER'], ARRAY['user:read'], ARRAY[]::text[], 0, 0
                )
                """);
    }

    private UserRegistrationCommand userRegistration(String email) {
        return new UserRegistrationCommand(
                "registered-user",
                email,
                "FixturePass123!",
                "Registered User",
                null,
                null,
                null,
                "Asia/Ho_Chi_Minh",
                "en",
                LocalDate.of(1995, 8, 15),
                "FEMALE",
                "USD",
                "light",
                "private",
                true,
                false,
                true,
                false,
                "Local registration fixture"
        );
    }

    private ShopRegistrationCommand shopRegistration(String email) {
        return new ShopRegistrationCommand(
                "registered-shop",
                email,
                "FixturePass123!",
                "Registered Shop",
                null,
                null,
                "Asia/Ho_Chi_Minh",
                "en",
                "Fixture Trading",
                "retail",
                null,
                null,
                "USD",
                "light",
                true,
                false,
                true
        );
    }

    private EcommerceProperties properties() {
        return new EcommerceProperties(
                new EcommerceProperties.Cors(List.of("http://localhost:3000")),
                new EcommerceProperties.Request("X-Request-Id", 2_097_152),
                new EcommerceProperties.Security(
                        "local-test",
                        "ecommerce-api",
                        "local-test-pepper-value-123456789",
                        8192,
                        60
                )
        );
    }
}
