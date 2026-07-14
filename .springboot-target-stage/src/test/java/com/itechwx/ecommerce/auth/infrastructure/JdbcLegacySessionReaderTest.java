package com.itechwx.ecommerce.auth.infrastructure;

import com.itechwx.ecommerce.auth.application.LegacySessionSnapshot;
import com.itechwx.ecommerce.auth.application.LegacyCredentialSnapshot;
import com.itechwx.ecommerce.auth.domain.ActorType;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import javax.sql.DataSource;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers(disabledWithoutDocker = true)
class JdbcLegacySessionReaderTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("ecommerce_auth_fixture")
            .withUsername("fixture_user")
            .withPassword("fixture_password");

    private static JdbcTemplate jdbc;
    private static JdbcLegacySessionReader reader;
    private static JdbcLegacyCredentialReader credentialReader;

    @BeforeAll
    static void migrateAndInsertFixture() {
        DataSource dataSource = org.springframework.boot.jdbc.DataSourceBuilder.create()
                .url(POSTGRES.getJdbcUrl())
                .username(POSTGRES.getUsername())
                .password(POSTGRES.getPassword())
                .build();
        Flyway.configure().dataSource(dataSource).locations("classpath:db/migration").load().migrate();
        jdbc = new JdbcTemplate(dataSource);
        reader = new JdbcLegacySessionReader(new NamedParameterJdbcTemplate(dataSource));
        credentialReader = new JdbcLegacyCredentialReader(new NamedParameterJdbcTemplate(dataSource));

        jdbc.update("""
                INSERT INTO accounts(id, account_type, status, is_active, created_at, updated_at)
                VALUES ('account-fixture', 'USER'::"AccountType", 'ACTIVE'::"Status", true, 0, 0)
                """);
        jdbc.update("""
                INSERT INTO account_authentication(
                    "accountId", email, password_hash, password_salt, is_active, created_at, updated_at
                )
                VALUES (
                    'account-fixture', 'fixture@example.test', 'hash-fixture', 'salt-fixture', true, 0, 0
                )
                """);
        jdbc.update("""
                INSERT INTO account_security("accountId", roles, permissions, backup_codes, created_at, updated_at)
                VALUES ('account-fixture', ARRAY['USER'], ARRAY['user:read'], ARRAY[]::text[], 0, 0)
                """);
        jdbc.update("""
                INSERT INTO key_tokens(id, auth_id, device_id, public_key, refresh_token, is_active, created_at, updated_at)
                VALUES ('key-fixture', 'account-fixture', 'device-fixture', 'public-key-fixture',
                        'refresh-token-fixture', true, 0, 0)
                """);
    }

    @Test
    void readsOnlyActiveScopedSessionAndFlagsRefreshTokenWithoutReturningIt() {
        LegacySessionSnapshot access = reader.findActive(
                "account-fixture", "device-fixture", "access-token-fixture"
        ).orElseThrow();
        LegacySessionSnapshot refresh = reader.findActive(
                "account-fixture", "device-fixture", "refresh-token-fixture"
        ).orElseThrow();

        assertThat(access.accountType()).isEqualTo("USER");
        assertThat(access.roles()).containsExactly("USER");
        assertThat(access.permissions()).containsExactly("user:read");
        assertThat(access.presentedTokenIsRefreshToken()).isFalse();
        assertThat(refresh.presentedTokenIsRefreshToken()).isTrue();
        assertThat(reader.findActive("other-account", "device-fixture", "token")).isEmpty();
    }

    @Test
    void revokedKeyTokenIsNotReturned() {
        jdbc.update("UPDATE key_tokens SET is_active = false WHERE id = 'key-fixture'");
        try {
            assertThat(reader.findActive("account-fixture", "device-fixture", "token")).isEmpty();
        } finally {
            jdbc.update("UPDATE key_tokens SET is_active = true WHERE id = 'key-fixture'");
        }
    }

    @Test
    void readsActiveCredentialOnlyForExpectedActorType() {
        LegacyCredentialSnapshot credential = credentialReader.findActiveByEmail(
                "fixture@example.test", ActorType.USER
        ).orElseThrow();

        assertThat(credential.accountId()).isEqualTo("account-fixture");
        assertThat(credential.passwordHash()).isEqualTo("hash-fixture");
        assertThat(credential.passwordSalt()).isEqualTo("salt-fixture");
        assertThat(credentialReader.findActiveByEmail(
                "fixture@example.test", ActorType.SHOP
        )).isEmpty();
    }
}
