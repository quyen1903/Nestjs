package com.itechwx.ecommerce.auth.infrastructure;

import com.itechwx.ecommerce.auth.application.IssuedTokenPair;
import com.itechwx.ecommerce.auth.application.RefreshTokenClaims;
import com.itechwx.ecommerce.auth.application.RefreshTokenResponse;
import com.itechwx.ecommerce.auth.application.RefreshTokenService;
import com.itechwx.ecommerce.auth.application.VerifiedCredential;
import com.itechwx.ecommerce.auth.domain.ActorType;
import com.itechwx.ecommerce.auth.security.LegacyAuthenticationException;
import com.itechwx.ecommerce.auth.security.LegacyRefreshTokenVerifier;
import com.itechwx.ecommerce.auth.security.LegacyTokenIssuer;
import com.itechwx.ecommerce.auth.security.TokenDigester;
import com.itechwx.ecommerce.shared.error.ApplicationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;
import java.util.List;
import java.util.UUID;

public final class JdbcRefreshTokenService implements RefreshTokenService {

    private static final String FIND_USED_TOKEN_OWNER = """
            SELECT key_token.auth_id
              FROM refresh_tokens_used used
              JOIN key_tokens key_token ON key_token.id = used.key_token_id
             WHERE used.refresh_token_digest = :digest
                OR (used.refresh_token_digest IS NULL AND used.refresh_token = :rawToken)
             FOR UPDATE OF used
            """;

    private static final String REVOKE_ALL = """
            UPDATE key_tokens
               SET is_active = false,
                   updated_at = :now
             WHERE auth_id = :accountId
               AND is_active = true
            """;

    private static final String LOCK_CURRENT_SESSION = """
            SELECT key_token.id,
                   key_token.public_key,
                   key_token.expires_at,
                   account.account_type::text AS account_type,
                   authentication.email,
                   (key_token.refresh_token_digest = :digest
                     OR (key_token.refresh_token_digest IS NULL
                         AND key_token.refresh_token = :rawToken)) AS token_matches
              FROM key_tokens key_token
              JOIN account_authentication authentication
                ON authentication."accountId" = key_token.auth_id
              JOIN accounts account
                ON account.id = key_token.auth_id
             WHERE key_token.auth_id = :accountId
               AND key_token.device_id = :deviceId
               AND key_token.is_active = true
               AND authentication.is_active = true
               AND account.is_active = true
               AND account.status = 'ACTIVE'::"Status"
             FOR UPDATE OF key_token, authentication, account
            """;

    private static final String ROTATE_KEY_TOKEN = """
            UPDATE key_tokens
               SET public_key = :publicKey,
                   refresh_token = :newRefreshToken,
                   refresh_token_digest = :newDigest,
                   expires_at = :expiresAt,
                   is_active = true,
                   updated_at = :now
             WHERE id = :keyTokenId
            """;

    private static final String INSERT_USED_TOKEN = """
            INSERT INTO refresh_tokens_used(
                id, key_token_id, refresh_token, refresh_token_digest,
                used_at, reason, is_active, created_at, updated_at
            ) VALUES (
                :id, :keyTokenId, :rawToken, :digest,
                CURRENT_TIMESTAMP, 'refresh', true, :now, :now
            )
            """;

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final TransactionTemplate transactionTemplate;
    private final LegacyRefreshTokenVerifier verifier;
    private final LegacyTokenIssuer tokenIssuer;
    private final TokenDigester tokenDigester;
    private final Clock clock;

    public JdbcRefreshTokenService(
            NamedParameterJdbcTemplate jdbcTemplate,
            TransactionTemplate transactionTemplate,
            LegacyRefreshTokenVerifier verifier,
            LegacyTokenIssuer tokenIssuer,
            TokenDigester tokenDigester,
            Clock clock
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.transactionTemplate = transactionTemplate;
        this.verifier = verifier;
        this.tokenIssuer = tokenIssuer;
        this.tokenDigester = tokenDigester;
        this.clock = clock;
    }

    @Override
    public RefreshTokenResponse refresh(String rawRefreshToken, ActorType expectedActorType) {
        RefreshTokenClaims claims = verifier.decodeUnverified(rawRefreshToken);
        String digest = tokenDigester.digest(rawRefreshToken);
        try {
            RotationOutcome outcome = transactionTemplate.execute(status -> rotate(
                    rawRefreshToken,
                    digest,
                    claims,
                    expectedActorType
            ));
            if (outcome == null || outcome.state() == RotationState.INVALID) {
                throw invalidToken();
            }
            if (outcome.state() == RotationState.REUSE) {
                throw new ApplicationException(
                        HttpStatus.FORBIDDEN,
                        "REFRESH_TOKEN_REUSE",
                        "Refresh token reuse was detected; all sessions were revoked."
                );
            }
            return new RefreshTokenResponse(
                    outcome.tokens().accessToken(),
                    outcome.tokens().refreshToken()
            );
        } catch (LegacyAuthenticationException exception) {
            throw invalidToken();
        } catch (DuplicateKeyException exception) {
            revokeAfterConcurrentReuse(claims.accountId());
            throw new ApplicationException(
                    HttpStatus.FORBIDDEN,
                    "REFRESH_TOKEN_REUSE",
                    "Refresh token reuse was detected; all sessions were revoked."
            );
        }
    }

    private RotationOutcome rotate(
            String rawToken,
            String digest,
            RefreshTokenClaims claims,
            ActorType expectedActorType
    ) {
        long now = clock.millis();
        MapSqlParameterSource parameters = new MapSqlParameterSource()
                .addValue("rawToken", rawToken)
                .addValue("digest", digest)
                .addValue("accountId", claims.accountId())
                .addValue("deviceId", claims.deviceId())
                .addValue("now", now);

        String reusedOwner = reusedTokenOwner(parameters);
        if (reusedOwner != null) {
            parameters.addValue("accountId", reusedOwner);
            jdbcTemplate.update(REVOKE_ALL, parameters);
            return new RotationOutcome(RotationState.REUSE, null);
        }

        List<RefreshSession> sessions = jdbcTemplate.query(
                LOCK_CURRENT_SESSION,
                parameters,
                (resultSet, rowNumber) -> new RefreshSession(
                        resultSet.getString("id"),
                        resultSet.getString("public_key"),
                        resultSet.getObject("expires_at", Long.class),
                        ActorType.valueOf(resultSet.getString("account_type")),
                        resultSet.getString("email"),
                        resultSet.getBoolean("token_matches")
                )
        );
        if (sessions.isEmpty()) {
            return new RotationOutcome(RotationState.INVALID, null);
        }
        RefreshSession session = sessions.getFirst();
        if (!session.tokenMatches()) {
            reusedOwner = reusedTokenOwner(parameters);
            if (reusedOwner != null) {
                parameters.addValue("accountId", reusedOwner);
                jdbcTemplate.update(REVOKE_ALL, parameters);
                return new RotationOutcome(RotationState.REUSE, null);
            }
            return new RotationOutcome(RotationState.INVALID, null);
        }
        if (session.actorType() != expectedActorType) {
            return new RotationOutcome(RotationState.INVALID, null);
        }
        verifier.verify(rawToken, session.publicKey(), session.expiresAt(), expectedActorType);

        IssuedTokenPair tokens = tokenIssuer.issue(
                new VerifiedCredential(claims.accountId(), session.email(), session.actorType()),
                claims.deviceId()
        );
        String newDigest = tokenDigester.digest(tokens.refreshToken());
        parameters
                .addValue("keyTokenId", session.keyTokenId())
                .addValue("publicKey", tokens.publicKeyPem())
                .addValue("newRefreshToken", tokens.refreshToken())
                .addValue("newDigest", newDigest)
                .addValue("expiresAt", tokens.refreshExpiresAtEpochMillis())
                .addValue("id", UUID.randomUUID().toString());

        jdbcTemplate.update(INSERT_USED_TOKEN, parameters);
        jdbcTemplate.update(ROTATE_KEY_TOKEN, parameters);
        return new RotationOutcome(RotationState.ROTATED, tokens);
    }

    private String reusedTokenOwner(MapSqlParameterSource parameters) {
        List<String> owners = jdbcTemplate.query(
                FIND_USED_TOKEN_OWNER,
                parameters,
                (resultSet, rowNumber) -> resultSet.getString(1)
        );
        return owners.isEmpty() ? null : owners.getFirst();
    }

    private void revokeAfterConcurrentReuse(String accountId) {
        transactionTemplate.executeWithoutResult(status -> jdbcTemplate.update(
                REVOKE_ALL,
                new MapSqlParameterSource()
                        .addValue("accountId", accountId)
                        .addValue("now", clock.millis())
        ));
    }

    private ApplicationException invalidToken() {
        return new ApplicationException(
                HttpStatus.UNAUTHORIZED,
                "INVALID_REFRESH_TOKEN",
                "The refresh token is invalid or expired."
        );
    }

    private enum RotationState {
        ROTATED,
        REUSE,
        INVALID
    }

    private record RotationOutcome(RotationState state, IssuedTokenPair tokens) {
    }

    private record RefreshSession(
            String keyTokenId,
            String publicKey,
            Long expiresAt,
            ActorType actorType,
            String email,
            boolean tokenMatches
    ) {
    }
}
