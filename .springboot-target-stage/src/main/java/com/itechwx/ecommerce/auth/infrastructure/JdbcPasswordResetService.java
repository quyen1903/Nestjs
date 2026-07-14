package com.itechwx.ecommerce.auth.infrastructure;

import com.itechwx.ecommerce.auth.application.PasswordResetNotifier;
import com.itechwx.ecommerce.auth.application.PasswordResetService;
import com.itechwx.ecommerce.auth.security.LegacyPasswordHasher;
import com.itechwx.ecommerce.auth.security.TokenDigester;
import com.itechwx.ecommerce.shared.error.ApplicationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import java.security.SecureRandom;
import java.time.Clock;
import java.util.Arrays;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

public final class JdbcPasswordResetService implements PasswordResetService {

    private static final Logger LOGGER = LoggerFactory.getLogger(JdbcPasswordResetService.class);
    public static final String GENERIC_MESSAGE =
            "If your email is registered with us, you will receive a password reset link";

    private static final String FIND_ACTIVE_USER = """
            SELECT account.id
              FROM accounts account
              JOIN account_authentication authentication
                ON authentication."accountId" = account.id
             WHERE lower(authentication.email) = :email
               AND account.account_type = 'USER'::"AccountType"
               AND account.status = 'ACTIVE'::"Status"
               AND account.is_active = true
               AND authentication.is_active = true
            """;

    private static final String INVALIDATE_EXISTING = """
            UPDATE password_resets
               SET is_used = true,
                   used_at = CURRENT_TIMESTAMP,
                   updated_at = :now
             WHERE auth_id = :accountId
               AND is_used = false
            """;

    private static final String INSERT_RESET = """
            INSERT INTO password_resets(
                id, auth_id, token, token_digest, token_hash,
                requested_at, expires_at, is_used, attempt_count,
                max_attempts, is_blocked, created_at, updated_at
            ) VALUES (
                :id, :accountId, :rawToken, :digest, :legacyHash,
                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 hour', false, 0,
                5, false, :now, :now
            )
            """;

    private static final String MARK_DELIVERY_FAILED = """
            UPDATE password_resets
               SET is_used = true,
                   is_blocked = true,
                   used_at = CURRENT_TIMESTAMP,
                   updated_at = :now
             WHERE id = :id
            """;

    private static final String LOCK_VALID_RESET = """
            SELECT id, auth_id
              FROM password_resets
             WHERE (token_digest = :digest
                    OR (token_digest IS NULL AND token = :rawToken))
               AND is_used = false
               AND is_blocked = false
               AND attempt_count < max_attempts
               AND expires_at > CURRENT_TIMESTAMP
             FOR UPDATE
            """;

    private static final String UPDATE_PASSWORD = """
            UPDATE account_authentication
               SET password_hash = :passwordHash,
                   password_salt = :passwordSalt,
                   updated_at = :now
             WHERE "accountId" = :accountId
               AND is_active = true
            """;

    private static final String CONSUME_RESET = """
            UPDATE password_resets
               SET is_used = true,
                   used_at = CURRENT_TIMESTAMP,
                   attempt_count = attempt_count + 1,
                   updated_at = :now
             WHERE id = :id
            """;

    private static final String REVOKE_SESSIONS = """
            UPDATE key_tokens
               SET is_active = false,
                   updated_at = :now
             WHERE auth_id = :accountId
               AND is_active = true
            """;

    private static final String VALIDATE_RESET = """
            SELECT count(*)
              FROM password_resets
             WHERE (token_digest = :digest
                    OR (token_digest IS NULL AND token = :rawToken))
               AND is_used = false
               AND is_blocked = false
               AND attempt_count < max_attempts
               AND expires_at > CURRENT_TIMESTAMP
            """;

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final TransactionTemplate transactionTemplate;
    private final TokenDigester tokenDigester;
    private final LegacyPasswordHasher passwordHasher;
    private final PasswordResetNotifier notifier;
    private final SecureRandom secureRandom;
    private final Clock clock;

    public JdbcPasswordResetService(
            NamedParameterJdbcTemplate jdbcTemplate,
            TransactionTemplate transactionTemplate,
            TokenDigester tokenDigester,
            LegacyPasswordHasher passwordHasher,
            PasswordResetNotifier notifier,
            SecureRandom secureRandom,
            Clock clock
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.transactionTemplate = transactionTemplate;
        this.tokenDigester = tokenDigester;
        this.passwordHasher = passwordHasher;
        this.notifier = notifier;
        this.secureRandom = secureRandom;
        this.clock = clock;
    }

    @Override
    public String request(String email) {
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        String rawToken = randomHex(32);
        String digest = tokenDigester.digest(rawToken);
        char[] tokenCharacters = rawToken.toCharArray();
        String legacyHash;
        try {
            legacyHash = passwordHasher.hash(tokenCharacters, "reset_salt");
        } finally {
            Arrays.fill(tokenCharacters, '\0');
        }

        List<String> accountIds = jdbcTemplate.query(
                FIND_ACTIVE_USER,
                new MapSqlParameterSource("email", normalizedEmail),
                (resultSet, rowNumber) -> resultSet.getString(1)
        );
        if (accountIds.isEmpty()) {
            return GENERIC_MESSAGE;
        }

        String resetId = UUID.randomUUID().toString();
        long now = clock.millis();
        MapSqlParameterSource parameters = new MapSqlParameterSource()
                .addValue("id", resetId)
                .addValue("accountId", accountIds.getFirst())
                .addValue("rawToken", rawToken)
                .addValue("digest", digest)
                .addValue("legacyHash", legacyHash)
                .addValue("now", now);
        transactionTemplate.executeWithoutResult(status -> {
            jdbcTemplate.update(INVALIDATE_EXISTING, parameters);
            jdbcTemplate.update(INSERT_RESET, parameters);
        });

        try {
            notifier.send(normalizedEmail, rawToken);
        } catch (RuntimeException exception) {
            jdbcTemplate.update(MARK_DELIVERY_FAILED, parameters);
            LOGGER.warn("Password reset delivery failed type={}", exception.getClass().getName());
        }
        return GENERIC_MESSAGE;
    }

    @Override
    public void reset(String rawResetToken, String newPassword) {
        if (!validTokenInput(rawResetToken)) {
            throw invalidResetToken();
        }
        String digest = tokenDigester.digest(rawResetToken);
        String passwordSalt = randomHex(32);
        char[] passwordCharacters = newPassword.toCharArray();
        String passwordHash;
        try {
            passwordHash = passwordHasher.hash(passwordCharacters, passwordSalt);
        } finally {
            Arrays.fill(passwordCharacters, '\0');
        }

        Boolean reset = transactionTemplate.execute(status -> {
            long now = clock.millis();
            MapSqlParameterSource parameters = new MapSqlParameterSource()
                    .addValue("rawToken", rawResetToken)
                    .addValue("digest", digest)
                    .addValue("passwordHash", passwordHash)
                    .addValue("passwordSalt", passwordSalt)
                    .addValue("now", now);
            List<ResetRow> rows = jdbcTemplate.query(
                    LOCK_VALID_RESET,
                    parameters,
                    (resultSet, rowNumber) -> new ResetRow(
                            resultSet.getString("id"),
                            resultSet.getString("auth_id")
                    )
            );
            if (rows.isEmpty()) {
                return false;
            }
            ResetRow row = rows.getFirst();
            parameters.addValue("id", row.id()).addValue("accountId", row.accountId());
            if (jdbcTemplate.update(UPDATE_PASSWORD, parameters) != 1) {
                return false;
            }
            jdbcTemplate.update(CONSUME_RESET, parameters);
            jdbcTemplate.update(REVOKE_SESSIONS, parameters);
            return true;
        });
        if (!Boolean.TRUE.equals(reset)) {
            throw invalidResetToken();
        }
    }

    @Override
    public boolean validate(String rawResetToken) {
        if (!validTokenInput(rawResetToken)) {
            return false;
        }
        String digest = tokenDigester.digest(rawResetToken);
        Integer count = jdbcTemplate.queryForObject(
                VALIDATE_RESET,
                new MapSqlParameterSource()
                        .addValue("rawToken", rawResetToken)
                        .addValue("digest", digest),
                Integer.class
        );
        return count != null && count > 0;
    }

    private String randomHex(int byteCount) {
        byte[] value = new byte[byteCount];
        secureRandom.nextBytes(value);
        return HexFormat.of().formatHex(value);
    }

    private boolean validTokenInput(String token) {
        return token != null && !token.isBlank() && token.length() <= 512;
    }

    private ApplicationException invalidResetToken() {
        return new ApplicationException(
                HttpStatus.BAD_REQUEST,
                "INVALID_RESET_TOKEN",
                "The password reset token is invalid or expired."
        );
    }

    private record ResetRow(String id, String accountId) {
    }
}
