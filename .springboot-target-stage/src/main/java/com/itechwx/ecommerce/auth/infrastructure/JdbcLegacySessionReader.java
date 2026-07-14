package com.itechwx.ecommerce.auth.infrastructure;

import com.itechwx.ecommerce.auth.application.LegacySessionReader;
import com.itechwx.ecommerce.auth.application.LegacySessionSnapshot;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

import java.sql.Array;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

public final class JdbcLegacySessionReader implements LegacySessionReader {

    private static final String FIND_ACTIVE = """
            SELECT kt.id AS key_token_id,
                   kt.auth_id,
                   kt.device_id,
                   aa.email,
                   a.account_type::text AS account_type,
                   kt.public_key,
                   kt.expires_at,
                   security.roles,
                   security.permissions,
                   (kt.refresh_token = :presentedToken) AS presented_is_refresh
              FROM key_tokens kt
              JOIN account_authentication aa
                ON aa."accountId" = kt.auth_id
              JOIN accounts a
                ON a.id = kt.auth_id
              LEFT JOIN account_security security
                ON security."accountId" = kt.auth_id
             WHERE kt.auth_id = :accountId
               AND kt.device_id = :deviceId
               AND kt.is_active = true
               AND aa.is_active = true
               AND a.is_active = true
               AND a.status = 'ACTIVE'::"Status"
            """;

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public JdbcLegacySessionReader(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public Optional<LegacySessionSnapshot> findActive(
            String accountId,
            String deviceId,
            String presentedToken
    ) {
        MapSqlParameterSource parameters = new MapSqlParameterSource()
                .addValue("accountId", accountId)
                .addValue("deviceId", deviceId)
                .addValue("presentedToken", presentedToken);

        return jdbcTemplate.query(FIND_ACTIVE, parameters, this::map).stream().findFirst();
    }

    private LegacySessionSnapshot map(ResultSet resultSet, int rowNumber) throws SQLException {
        Long expiresAt = resultSet.getObject("expires_at", Long.class);
        return new LegacySessionSnapshot(
                resultSet.getString("key_token_id"),
                resultSet.getString("auth_id"),
                resultSet.getString("device_id"),
                resultSet.getString("email"),
                resultSet.getString("account_type"),
                resultSet.getString("public_key"),
                expiresAt,
                textArray(resultSet, "roles"),
                textArray(resultSet, "permissions"),
                resultSet.getBoolean("presented_is_refresh")
        );
    }

    private List<String> textArray(ResultSet resultSet, String column) throws SQLException {
        Array array = resultSet.getArray(column);
        if (array == null) {
            return List.of();
        }
        try {
            return Arrays.stream((String[]) array.getArray())
                    .filter(value -> value != null)
                    .toList();
        } finally {
            array.free();
        }
    }
}
