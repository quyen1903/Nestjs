package com.itechwx.ecommerce.auth.infrastructure;

import com.itechwx.ecommerce.auth.application.AccountIdentityResponse;
import com.itechwx.ecommerce.auth.application.AuthSessionStore;
import com.itechwx.ecommerce.auth.application.GoogleOAuthLoginService;
import com.itechwx.ecommerce.auth.application.IssuedTokenPair;
import com.itechwx.ecommerce.auth.application.UserLoginResponse;
import com.itechwx.ecommerce.auth.application.VerifiedCredential;
import com.itechwx.ecommerce.auth.domain.ActorType;
import com.itechwx.ecommerce.auth.security.LegacyTokenIssuer;
import com.itechwx.ecommerce.auth.security.TokenDigester;
import com.itechwx.ecommerce.shared.error.ApplicationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

public final class JdbcGoogleOAuthLoginService implements GoogleOAuthLoginService {

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final TransactionTemplate transactionTemplate;
    private final LegacyTokenIssuer tokenIssuer;
    private final TokenDigester tokenDigester;
    private final AuthSessionStore sessionStore;
    private final Clock clock;

    public JdbcGoogleOAuthLoginService(
            NamedParameterJdbcTemplate jdbcTemplate,
            TransactionTemplate transactionTemplate,
            LegacyTokenIssuer tokenIssuer,
            TokenDigester tokenDigester,
            AuthSessionStore sessionStore,
            Clock clock
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.transactionTemplate = transactionTemplate;
        this.tokenIssuer = tokenIssuer;
        this.tokenDigester = tokenDigester;
        this.sessionStore = sessionStore;
        this.clock = clock;
    }

    @Override
    public UserLoginResponse login(
            String providerId,
            String email,
            String displayName,
            String avatar,
            boolean emailVerified
    ) {
        if (!emailVerified) {
            throw new ApplicationException(
                    HttpStatus.UNAUTHORIZED,
                    "OAUTH_EMAIL_NOT_VERIFIED",
                    "A verified provider email is required."
            );
        }
        String normalizedProviderId = required(providerId, "provider id", 255);
        String normalizedEmail = required(email, "email", 320).toLowerCase(Locale.ROOT);
        if (normalizedEmail.indexOf('@') <= 0
                || normalizedEmail.indexOf('@') == normalizedEmail.length() - 1) {
            throw new ApplicationException(
                    HttpStatus.UNAUTHORIZED,
                    "INVALID_OAUTH_IDENTITY",
                    "The provider did not return a valid email."
            );
        }
        String normalizedName = defaultName(displayName, normalizedEmail);
        String normalizedAvatar = optional(avatar, 2_000);
        try {
            return transactionTemplate.execute(status -> {
                OAuthAccount account = findExistingSocial(normalizedProviderId);
                if (account == null) {
                    account = findOrCreateByEmail(
                            normalizedProviderId,
                            normalizedEmail,
                            normalizedName,
                            normalizedAvatar
                    );
                }
                if (!normalizedEmail.equalsIgnoreCase(account.email())) {
                    throw new ApplicationException(
                            HttpStatus.CONFLICT,
                            "OAUTH_IDENTITY_CONFLICT",
                            "The provider identity does not match the linked account."
                    );
                }
                String deviceId = UUID.randomUUID().toString();
                VerifiedCredential credential = new VerifiedCredential(
                        account.accountId(),
                        account.email(),
                        ActorType.USER
                );
                IssuedTokenPair tokens = tokenIssuer.issue(credential, deviceId);
                sessionStore.persistLogin(
                        credential,
                        deviceId,
                        "Google OAuth",
                        tokens,
                        tokenDigester.digest(tokens.refreshToken())
                );
                return new UserLoginResponse(
                        new AccountIdentityResponse(account.accountId()),
                        tokens.accessToken(),
                        tokens.refreshToken()
                );
            });
        } catch (DataIntegrityViolationException exception) {
            throw new ApplicationException(
                    HttpStatus.CONFLICT,
                    "OAUTH_ACCOUNT_CONFLICT",
                    "The provider identity is already linked to another account."
            );
        }
    }

    private OAuthAccount findExistingSocial(String providerId) {
        List<OAuthAccount> accounts = jdbcTemplate.query("""
                SELECT account.id, authentication.email
                  FROM social_authentication social
                  JOIN account_authentication authentication
                    ON authentication."accountId" = social.auth_id
                  JOIN accounts account ON account.id = authentication."accountId"
                 WHERE social.provider = 'google'
                   AND social.provider_id = :providerId
                   AND social.is_active = true
                   AND authentication.is_active = true
                   AND account.account_type = 'USER'::"AccountType"
                   AND account.status = 'ACTIVE'::"Status"
                   AND account.is_active = true
                 FOR UPDATE
                """, new MapSqlParameterSource("providerId", providerId),
                (resultSet, rowNumber) -> new OAuthAccount(
                        resultSet.getString("id"),
                        resultSet.getString("email")
                ));
        return accounts.isEmpty() ? null : accounts.getFirst();
    }

    private OAuthAccount findOrCreateByEmail(
            String providerId,
            String email,
            String displayName,
            String avatar
    ) {
        List<EmailAccount> accounts = jdbcTemplate.query("""
                SELECT account.id, account.account_type::text AS account_type
                  FROM account_authentication authentication
                  JOIN accounts account ON account.id = authentication."accountId"
                 WHERE lower(authentication.email) = :email
                   AND authentication.is_active = true
                   AND account.status = 'ACTIVE'::"Status"
                   AND account.is_active = true
                 FOR UPDATE
                """, new MapSqlParameterSource("email", email),
                (resultSet, rowNumber) -> new EmailAccount(
                        resultSet.getString("id"),
                        resultSet.getString("account_type")
                ));
        String accountId;
        if (accounts.isEmpty()) {
            accountId = createOAuthUser(email, displayName, avatar);
        } else {
            EmailAccount account = accounts.getFirst();
            if (!ActorType.USER.name().equals(account.accountType())) {
                throw new ApplicationException(
                        HttpStatus.CONFLICT,
                        "OAUTH_ACCOUNT_TYPE_CONFLICT",
                        "The verified email belongs to a different account type."
                );
            }
            accountId = account.accountId();
            jdbcTemplate.update("""
                    UPDATE account_authentication
                       SET auth_method = 'HYBRID'::"AuthMethod",
                           is_verified = true,
                           updated_at = :now
                     WHERE "accountId" = :accountId
                    """, new MapSqlParameterSource()
                    .addValue("accountId", accountId)
                    .addValue("now", clock.millis()));
        }
        insertSocial(accountId, providerId, email);
        return new OAuthAccount(accountId, email);
    }

    private String createOAuthUser(String email, String displayName, String avatar) {
        String accountId = UUID.randomUUID().toString();
        String threadId = UUID.randomUUID().toString();
        long now = clock.millis();
        MapSqlParameterSource parameters = new MapSqlParameterSource()
                .addValue("accountId", accountId)
                .addValue("threadId", threadId)
                .addValue("email", email)
                .addValue("name", displayName)
                .addValue("avatar", avatar)
                .addValue("now", now);
        jdbcTemplate.update("""
                INSERT INTO accounts(id, account_type, status, is_active, created_at, updated_at)
                VALUES (:accountId, 'USER'::"AccountType", 'ACTIVE'::"Status", true, :now, :now)
                """, parameters);
        jdbcTemplate.update("""
                INSERT INTO account_authentication(
                    "accountId", email, auth_method, is_verified, is_active, created_at, updated_at
                ) VALUES (
                    :accountId, :email, 'OAUTH2_ONLY'::"AuthMethod", true, true, :now, :now
                )
                """, parameters);
        jdbcTemplate.update("""
                INSERT INTO account_profiles(
                    "accountId", name, avatar, language, created_at, updated_at
                ) VALUES (:accountId, :name, :avatar, 'en', :now, :now)
                """, parameters);
        jdbcTemplate.update("""
                INSERT INTO user_behavior(
                    "accountId", loyalty_points, membership_tier, sex, preferences,
                    date_of_birth, created_at, updated_at
                ) VALUES (
                    :accountId, 0, 'bronze', 'FEMALE'::"Sex", '{}'::jsonb,
                    TIMESTAMP '1970-01-01 00:00:00', :now, :now
                )
                """, parameters);
        jdbcTemplate.update("""
                INSERT INTO account_security(
                    "accountId", roles, permissions, backup_codes, created_at, updated_at
                ) VALUES (
                    :accountId, ARRAY['USER'], ARRAY['user:read','user:write'],
                    ARRAY[]::text[], :now, :now
                )
                """, parameters);
        jdbcTemplate.update("""
                INSERT INTO account_preferences("accountId", created_at, updated_at)
                VALUES (:accountId, :now, :now)
                """, parameters);
        jdbcTemplate.update("""
                INSERT INTO notification_threads(id, noti_thread_user_id, is_active, created_at, updated_at)
                VALUES (:threadId, :accountId, true, :now, :now)
                """, parameters);
        return accountId;
    }

    private void insertSocial(String accountId, String providerId, String email) {
        jdbcTemplate.update("""
                INSERT INTO social_authentication(
                    id, auth_id, provider, provider_id, provider_email,
                    access_token, refresh_token, is_active, created_at, updated_at
                ) VALUES (
                    :id, :accountId, 'google', :providerId, :email,
                    NULL, NULL, true, :now, :now
                )
                """, new MapSqlParameterSource()
                .addValue("id", UUID.randomUUID().toString())
                .addValue("accountId", accountId)
                .addValue("providerId", providerId)
                .addValue("email", email)
                .addValue("now", clock.millis()));
    }

    private String required(String value, String label, int maxLength) {
        String normalized = optional(value, maxLength);
        if (normalized == null) {
            throw new ApplicationException(
                    HttpStatus.UNAUTHORIZED,
                    "INVALID_OAUTH_IDENTITY",
                    "The provider did not return a valid " + label + "."
            );
        }
        return normalized;
    }

    private String defaultName(String displayName, String email) {
        String normalized = optional(displayName, 100);
        return normalized == null ? email.substring(0, email.indexOf('@')) : normalized;
    }

    private String optional(String value, int maxLength) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim();
        if (normalized.length() > maxLength) {
            throw new ApplicationException(
                    HttpStatus.UNAUTHORIZED,
                    "INVALID_OAUTH_IDENTITY",
                    "The provider identity is invalid."
            );
        }
        return normalized;
    }

    private record OAuthAccount(String accountId, String email) {
    }

    private record EmailAccount(String accountId, String accountType) {
    }
}
