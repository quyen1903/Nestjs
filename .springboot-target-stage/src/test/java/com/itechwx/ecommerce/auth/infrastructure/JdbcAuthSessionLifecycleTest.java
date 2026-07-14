package com.itechwx.ecommerce.auth.infrastructure;

import com.itechwx.ecommerce.auth.application.IssuedTokenPair;
import com.itechwx.ecommerce.auth.application.RefreshTokenResponse;
import com.itechwx.ecommerce.auth.application.VerifiedCredential;
import com.itechwx.ecommerce.auth.domain.ActorType;
import com.itechwx.ecommerce.auth.security.LegacyRefreshTokenVerifier;
import com.itechwx.ecommerce.auth.security.LegacyTokenIssuer;
import com.itechwx.ecommerce.auth.security.TokenDigester;
import com.itechwx.ecommerce.auth.security.LegacyPasswordHasher;
import com.itechwx.ecommerce.auth.security.LegacyPasswordVerifier;
import com.itechwx.ecommerce.shared.config.EcommerceProperties;
import com.itechwx.ecommerce.shared.error.ApplicationException;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import javax.sql.DataSource;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;
import java.security.SecureRandom;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Testcontainers(disabledWithoutDocker = true)
class JdbcAuthSessionLifecycleTest {

    private static final Instant NOW = Instant.parse("2026-06-29T12:00:00Z");

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("ecommerce_auth_lifecycle_fixture")
            .withUsername("fixture_user")
            .withPassword("fixture_password");

    private static DataSource dataSource;
    private static JdbcTemplate jdbc;
    private static NamedParameterJdbcTemplate namedJdbc;
    private static TransactionTemplate transactions;
    private static Clock clock;
    private static TokenDigester digester;
    private static LegacyTokenIssuer issuer;
    private static JdbcAuthSessionStore sessionStore;
    private static JdbcRefreshTokenService refreshService;
    private static JdbcPasswordResetService passwordResetService;
    private static AtomicReference<String> deliveredResetToken;

    @BeforeAll
    static void migrate() {
        dataSource = org.springframework.boot.jdbc.DataSourceBuilder.create()
                .url(POSTGRES.getJdbcUrl())
                .username(POSTGRES.getUsername())
                .password(POSTGRES.getPassword())
                .build();
        Flyway.configure().dataSource(dataSource).locations("classpath:db/migration").load().migrate();
        jdbc = new JdbcTemplate(dataSource);
        namedJdbc = new NamedParameterJdbcTemplate(dataSource);
        transactions = new TransactionTemplate(new DataSourceTransactionManager(dataSource));
        clock = Clock.fixed(NOW, ZoneOffset.UTC);
        EcommerceProperties properties = properties();
        digester = new TokenDigester(properties);
        issuer = new LegacyTokenIssuer(clock, properties);
        sessionStore = new JdbcAuthSessionStore(namedJdbc, transactions, clock);
        refreshService = new JdbcRefreshTokenService(
                namedJdbc,
                transactions,
                new LegacyRefreshTokenVerifier(clock, properties),
                issuer,
                digester,
                clock
        );
        deliveredResetToken = new AtomicReference<>();
        passwordResetService = new JdbcPasswordResetService(
                namedJdbc,
                transactions,
                digester,
                new LegacyPasswordHasher(),
                (recipientEmail, rawResetToken) -> deliveredResetToken.set(rawResetToken),
                new SecureRandom(),
                clock
        );
    }

    @BeforeEach
    void resetFixture() {
        jdbc.update("DELETE FROM refresh_tokens_used");
        jdbc.update("DELETE FROM key_tokens");
        jdbc.update("DELETE FROM \"DeviceSession\"");
        jdbc.update("DELETE FROM password_resets");
        jdbc.update("DELETE FROM account_security");
        jdbc.update("DELETE FROM account_authentication");
        jdbc.update("DELETE FROM accounts");
        insertAccount("account-fixture", "fixture@example.test");
        deliveredResetToken.set(null);
    }

    @Test
    void loginDualWritesDigestAndRejectsCrossAccountDeviceCollision() {
        IssuedTokenPair tokens = persistLogin("account-fixture", "fixture@example.test", "shared-device");

        assertThat(jdbc.queryForObject(
                "SELECT refresh_token FROM key_tokens WHERE auth_id = 'account-fixture'",
                String.class
        )).isEqualTo(tokens.refreshToken());
        String digest = jdbc.queryForObject(
                "SELECT refresh_token_digest FROM key_tokens WHERE auth_id = 'account-fixture'",
                String.class
        );
        assertThat(digester.matches(digest, tokens.refreshToken())).isTrue();
        assertThat(jdbc.queryForObject(
                "SELECT \"accountId\" FROM \"DeviceSession\" WHERE \"deviceId\" = 'shared-device'",
                String.class
        )).isEqualTo("account-fixture");

        insertAccount("other-account", "other@example.test");
        IssuedTokenPair otherTokens = issuer.issue(
                new VerifiedCredential("other-account", "other@example.test", ActorType.USER),
                "shared-device"
        );
        assertThatThrownBy(() -> sessionStore.persistLogin(
                new VerifiedCredential("other-account", "other@example.test", ActorType.USER),
                "shared-device",
                "Other browser",
                otherTokens,
                digester.digest(otherTokens.refreshToken())
        )).isInstanceOf(ApplicationException.class)
                .extracting(exception -> ((ApplicationException) exception).code())
                .isEqualTo("DEVICE_ID_IN_USE");
        assertThat(jdbc.queryForObject(
                "SELECT count(*) FROM key_tokens WHERE auth_id = 'other-account'",
                Integer.class
        )).isZero();
    }

    @Test
    void refreshRotatesAtomicallyAndReuseRevokesAllSessions() {
        IssuedTokenPair original = persistLogin(
                "account-fixture", "fixture@example.test", "device-fixture"
        );

        RefreshTokenResponse rotated = refreshService.refresh(original.refreshToken(), ActorType.USER);

        assertThat(rotated.refreshToken()).isNotEqualTo(original.refreshToken());
        assertThat(jdbc.queryForObject(
                "SELECT count(*) FROM refresh_tokens_used WHERE refresh_token = ? "
                        + "AND refresh_token_digest IS NOT NULL",
                Integer.class,
                original.refreshToken()
        )).isEqualTo(1);

        assertThatThrownBy(() -> refreshService.refresh(original.refreshToken(), ActorType.USER))
                .isInstanceOf(ApplicationException.class)
                .extracting(exception -> ((ApplicationException) exception).code())
                .isEqualTo("REFRESH_TOKEN_REUSE");
        assertThat(jdbc.queryForObject(
                "SELECT count(*) FROM key_tokens WHERE auth_id = 'account-fixture' AND is_active = true",
                Integer.class
        )).isZero();
    }

    @Test
    void concurrentRefreshHasOneSuccessAndOneReuseFailureWithoutActiveSession() throws Exception {
        IssuedTokenPair original = persistLogin(
                "account-fixture", "fixture@example.test", "device-fixture"
        );
        Callable<String> refresh = () -> {
            try {
                refreshService.refresh(original.refreshToken(), ActorType.USER);
                return "SUCCESS";
            } catch (ApplicationException exception) {
                return exception.code();
            }
        };

        try (var executor = Executors.newFixedThreadPool(2)) {
            List<String> results = executor.invokeAll(List.of(refresh, refresh)).stream()
                    .map(future -> {
                        try {
                            return future.get();
                        } catch (Exception exception) {
                            throw new AssertionError(exception);
                        }
                    })
                    .toList();

            assertThat(results).containsExactlyInAnyOrder("SUCCESS", "REFRESH_TOKEN_REUSE");
        }
        assertThat(jdbc.queryForObject(
                "SELECT count(*) FROM key_tokens WHERE auth_id = 'account-fixture' AND is_active = true",
                Integer.class
        )).isZero();
    }

    @Test
    void passwordResetDualWritesDigestConsumesOnceAndRevokesSessions() {
        persistLogin("account-fixture", "fixture@example.test", "device-fixture");

        String message = passwordResetService.request("FIXTURE@EXAMPLE.TEST");
        String rawToken = deliveredResetToken.get();

        assertThat(message).isEqualTo(JdbcPasswordResetService.GENERIC_MESSAGE);
        assertThat(rawToken).isNotBlank();
        String resetDigest = jdbc.queryForObject(
                "SELECT token_digest FROM password_resets WHERE auth_id = 'account-fixture' AND is_used = false",
                String.class
        );
        assertThat(digester.matches(resetDigest, rawToken)).isTrue();
        assertThat(passwordResetService.validate(rawToken)).isTrue();

        passwordResetService.reset(rawToken, "NextPass1!");

        String hash = jdbc.queryForObject(
                "SELECT password_hash FROM account_authentication WHERE \"accountId\" = 'account-fixture'",
                String.class
        );
        String salt = jdbc.queryForObject(
                "SELECT password_salt FROM account_authentication WHERE \"accountId\" = 'account-fixture'",
                String.class
        );
        assertThat(new LegacyPasswordVerifier().matches("NextPass1!".toCharArray(), salt, hash)).isTrue();
        assertThat(passwordResetService.validate(rawToken)).isFalse();
        assertThat(jdbc.queryForObject(
                "SELECT count(*) FROM key_tokens WHERE auth_id = 'account-fixture' AND is_active = true",
                Integer.class
        )).isZero();
        assertThatThrownBy(() -> passwordResetService.reset(rawToken, "Another1!"))
                .isInstanceOf(ApplicationException.class)
                .extracting(exception -> ((ApplicationException) exception).code())
                .isEqualTo("INVALID_RESET_TOKEN");
    }

    private IssuedTokenPair persistLogin(String accountId, String email, String deviceId) {
        VerifiedCredential credential = new VerifiedCredential(accountId, email, ActorType.USER);
        IssuedTokenPair tokens = issuer.issue(credential, deviceId);
        sessionStore.persistLogin(
                credential,
                deviceId,
                "Browser fixture",
                tokens,
                digester.digest(tokens.refreshToken())
        );
        return tokens;
    }

    private void insertAccount(String accountId, String email) {
        jdbc.update("""
                INSERT INTO accounts(id, account_type, status, is_active, created_at, updated_at)
                VALUES (?, 'USER'::"AccountType", 'ACTIVE'::"Status", true, 0, 0)
                """, accountId);
        jdbc.update("""
                INSERT INTO account_authentication(
                    "accountId", email, password_hash, password_salt,
                    is_active, created_at, updated_at
                ) VALUES (?, ?, 'hash-fixture', 'salt-fixture', true, 0, 0)
                """, accountId, email);
        jdbc.update("""
                INSERT INTO account_security(
                    "accountId", roles, permissions, backup_codes, created_at, updated_at
                ) VALUES (?, ARRAY['USER'], ARRAY['user:read'], ARRAY[]::text[], 0, 0)
                """, accountId);
    }

    private static EcommerceProperties properties() {
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
