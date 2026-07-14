package com.itechwx.ecommerce.auth.infrastructure;

import com.itechwx.ecommerce.auth.application.AuthSessionStore;
import com.itechwx.ecommerce.auth.application.IssuedTokenPair;
import com.itechwx.ecommerce.auth.application.VerifiedCredential;
import com.itechwx.ecommerce.shared.error.ApplicationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.UUID;
import java.time.Clock;

public final class JdbcAuthSessionStore implements AuthSessionStore {

    private static final String LOCK_ACTIVE_ACCOUNT = """
            SELECT account.account_type::text
              FROM accounts account
              JOIN account_authentication authentication
                ON authentication."accountId" = account.id
             WHERE account.id = :accountId
               AND account.account_type::text = :accountType
               AND account.status = 'ACTIVE'::"Status"
               AND account.is_active = true
               AND authentication.is_active = true
             FOR UPDATE OF account, authentication
            """;

    private static final String LOCK_DEVICE = """
            SELECT "accountId"
              FROM "DeviceSession"
             WHERE "deviceId" = :deviceId
             FOR UPDATE
            """;

    private static final String INSERT_DEVICE = """
            INSERT INTO "DeviceSession"(
                id, "accountId", "deviceId", "deviceName", "lastLogin",
                is_active, created_at, updated_at
            ) VALUES (
                :id, :accountId, :deviceId, :deviceName, CURRENT_TIMESTAMP,
                true, :now, :now
            )
            """;

    private static final String UPDATE_DEVICE = """
            UPDATE "DeviceSession"
               SET "deviceName" = COALESCE(:deviceName, "deviceName"),
                   "lastLogin" = CURRENT_TIMESTAMP,
                   is_active = true,
                   updated_at = :now
             WHERE "deviceId" = :deviceId
               AND "accountId" = :accountId
            """;

    private static final String UPSERT_KEY_TOKEN = """
            INSERT INTO key_tokens(
                id, auth_id, device_id, public_key, refresh_token,
                refresh_token_digest, expires_at, is_active, created_at, updated_at
            ) VALUES (
                :id, :accountId, :deviceId, :publicKey, :refreshToken,
                :refreshTokenDigest, :expiresAt, true, :now, :now
            )
            ON CONFLICT (auth_id, device_id) DO UPDATE
               SET public_key = EXCLUDED.public_key,
                   refresh_token = EXCLUDED.refresh_token,
                   refresh_token_digest = EXCLUDED.refresh_token_digest,
                   expires_at = EXCLUDED.expires_at,
                   is_active = true,
                   updated_at = EXCLUDED.updated_at
            """;

    private static final String UPDATE_LOGIN_METADATA = """
            UPDATE account_authentication
               SET last_login_at = :now,
                   login_count = login_count + 1,
                   updated_at = :now
             WHERE "accountId" = :accountId
            """;

    private static final String REVOKE = """
            UPDATE key_tokens
               SET is_active = false,
                   updated_at = :now
             WHERE auth_id = :accountId
               AND device_id = :deviceId
               AND is_active = true
            """;

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final TransactionTemplate transactionTemplate;
    private final Clock clock;

    public JdbcAuthSessionStore(
            NamedParameterJdbcTemplate jdbcTemplate,
            TransactionTemplate transactionTemplate,
            Clock clock
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.transactionTemplate = transactionTemplate;
        this.clock = clock;
    }

    @Override
    public void persistLogin(
            VerifiedCredential credential,
            String deviceId,
            String deviceName,
            IssuedTokenPair tokens,
            String refreshTokenDigest
    ) {
        transactionTemplate.executeWithoutResult(status -> {
            long now = clock.millis();
            MapSqlParameterSource identity = new MapSqlParameterSource()
                    .addValue("accountId", credential.accountId())
                    .addValue("accountType", credential.actorType().name())
                    .addValue("deviceId", deviceId)
                    .addValue("deviceName", deviceName)
                    .addValue("now", now);

            List<String> active = jdbcTemplate.query(
                    LOCK_ACTIVE_ACCOUNT,
                    identity,
                    (resultSet, rowNumber) -> resultSet.getString(1)
            );
            if (active.isEmpty()) {
                throw new ApplicationException(
                        HttpStatus.UNAUTHORIZED,
                        "INVALID_CREDENTIALS",
                        "The email or password is invalid."
                );
            }

            List<String> deviceOwners = jdbcTemplate.query(
                    LOCK_DEVICE,
                    identity,
                    (resultSet, rowNumber) -> resultSet.getString(1)
            );
            if (!deviceOwners.isEmpty() && !credential.accountId().equals(deviceOwners.getFirst())) {
                throw new ApplicationException(
                        HttpStatus.CONFLICT,
                        "DEVICE_ID_IN_USE",
                        "The device identifier is already assigned."
                );
            }
            if (deviceOwners.isEmpty()) {
                identity.addValue("id", UUID.randomUUID().toString());
                jdbcTemplate.update(INSERT_DEVICE, identity);
            } else {
                jdbcTemplate.update(UPDATE_DEVICE, identity);
            }

            MapSqlParameterSource keyToken = new MapSqlParameterSource()
                    .addValue("id", UUID.randomUUID().toString())
                    .addValue("accountId", credential.accountId())
                    .addValue("deviceId", deviceId)
                    .addValue("publicKey", tokens.publicKeyPem())
                    .addValue("refreshToken", tokens.refreshToken())
                    .addValue("refreshTokenDigest", refreshTokenDigest)
                    .addValue("expiresAt", tokens.refreshExpiresAtEpochMillis())
                    .addValue("now", now);
            jdbcTemplate.update(UPSERT_KEY_TOKEN, keyToken);
            jdbcTemplate.update(UPDATE_LOGIN_METADATA, identity);
        });
    }

    @Override
    public int revoke(String accountId, String deviceId) {
        return jdbcTemplate.update(REVOKE, new MapSqlParameterSource()
                .addValue("accountId", accountId)
                .addValue("deviceId", deviceId)
                .addValue("now", clock.millis()));
    }
}
