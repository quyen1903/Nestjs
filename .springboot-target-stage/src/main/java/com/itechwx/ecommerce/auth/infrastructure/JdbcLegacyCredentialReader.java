package com.itechwx.ecommerce.auth.infrastructure;

import com.itechwx.ecommerce.auth.application.LegacyCredentialReader;
import com.itechwx.ecommerce.auth.application.LegacyCredentialSnapshot;
import com.itechwx.ecommerce.auth.domain.ActorType;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

import java.time.Clock;
import java.util.Optional;

public final class JdbcLegacyCredentialReader implements LegacyCredentialReader {

    private static final String FIND_ACTIVE = """
            SELECT a.id AS account_id,
                   a.account_type::text AS account_type,
                   authentication.email,
                   authentication.password_hash,
                   authentication.password_salt
              FROM accounts a
              JOIN account_authentication authentication
                ON authentication."accountId" = a.id
              JOIN account_security security
                ON security."accountId" = a.id
             WHERE lower(authentication.email) = :email
               AND a.account_type::text = :accountType
               AND a.is_active = true
               AND a.status = 'ACTIVE'::"Status"
               AND authentication.is_active = true
               AND (security.locked_until IS NULL OR security.locked_until <= :now)
            """;

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final Clock clock;

    public JdbcLegacyCredentialReader(NamedParameterJdbcTemplate jdbcTemplate) {
        this(jdbcTemplate, Clock.systemUTC());
    }

    public JdbcLegacyCredentialReader(NamedParameterJdbcTemplate jdbcTemplate, Clock clock) {
        this.jdbcTemplate = jdbcTemplate;
        this.clock = clock;
    }

    @Override
    public Optional<LegacyCredentialSnapshot> findActiveByEmail(
            String normalizedEmail,
            ActorType actorType
    ) {
        MapSqlParameterSource parameters = new MapSqlParameterSource()
                .addValue("email", normalizedEmail)
                .addValue("accountType", actorType.name())
                .addValue("now", clock.millis());
        return jdbcTemplate.query(FIND_ACTIVE, parameters, (resultSet, rowNumber) ->
                new LegacyCredentialSnapshot(
                        resultSet.getString("account_id"),
                        resultSet.getString("email"),
                        resultSet.getString("account_type"),
                        resultSet.getString("password_hash"),
                        resultSet.getString("password_salt")
                )).stream().findFirst();
    }
}
