package com.itechwx.ecommerce.auth.infrastructure;

import com.itechwx.ecommerce.auth.application.CredentialAttemptStore;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

import java.time.Clock;
import java.time.Duration;

public final class JdbcCredentialAttemptStore implements CredentialAttemptStore {

    static final int LOCKOUT_THRESHOLD = 5;
    static final Duration LOCKOUT_DURATION = Duration.ofMinutes(15);

    private static final String RECORD_FAILURE = """
            UPDATE account_security
               SET failed_login_attempts = failed_login_attempts + 1,
                   locked_until = CASE
                       WHEN failed_login_attempts + 1 >= :threshold THEN :lockedUntil
                       ELSE locked_until
                   END,
                   suspicious_activity = CASE
                       WHEN failed_login_attempts + 1 >= :threshold THEN true
                       ELSE suspicious_activity
                   END,
                   updated_at = :now
             WHERE "accountId" = :accountId
            """;

    private static final String RECORD_SUCCESS = """
            UPDATE account_security
               SET failed_login_attempts = 0,
                   locked_until = NULL,
                   updated_at = :now
             WHERE "accountId" = :accountId
            """;

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final Clock clock;

    public JdbcCredentialAttemptStore(NamedParameterJdbcTemplate jdbcTemplate, Clock clock) {
        this.jdbcTemplate = jdbcTemplate;
        this.clock = clock;
    }

    @Override
    public void recordFailure(String accountId) {
        long now = clock.millis();
        jdbcTemplate.update(RECORD_FAILURE, new MapSqlParameterSource()
                .addValue("accountId", accountId)
                .addValue("threshold", LOCKOUT_THRESHOLD)
                .addValue("lockedUntil", now + LOCKOUT_DURATION.toMillis())
                .addValue("now", now));
    }

    @Override
    public void recordSuccess(String accountId) {
        jdbcTemplate.update(RECORD_SUCCESS, new MapSqlParameterSource()
                .addValue("accountId", accountId)
                .addValue("now", clock.millis()));
    }
}
