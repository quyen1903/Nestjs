package com.itechwx.ecommerce.auth.infrastructure;

import com.itechwx.ecommerce.auth.application.AccountIdentityResponse;
import com.itechwx.ecommerce.auth.application.AccountRegistrationService;
import com.itechwx.ecommerce.auth.application.AuthSessionStore;
import com.itechwx.ecommerce.auth.application.IssuedTokenPair;
import com.itechwx.ecommerce.auth.application.NotificationThreadResponse;
import com.itechwx.ecommerce.auth.application.ShopLoginResponse;
import com.itechwx.ecommerce.auth.application.ShopRegistrationCommand;
import com.itechwx.ecommerce.auth.application.UserRegistrationCommand;
import com.itechwx.ecommerce.auth.application.UserRegistrationResponse;
import com.itechwx.ecommerce.auth.application.VerifiedCredential;
import com.itechwx.ecommerce.auth.domain.ActorType;
import com.itechwx.ecommerce.auth.security.LegacyPasswordHasher;
import com.itechwx.ecommerce.auth.security.LegacyTokenIssuer;
import com.itechwx.ecommerce.auth.security.TokenDigester;
import com.itechwx.ecommerce.shared.error.ApplicationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.HexFormat;
import java.util.Locale;
import java.util.UUID;

public final class JdbcAccountRegistrationService implements AccountRegistrationService {

    private static final String INSERT_ACCOUNT = """
            INSERT INTO accounts(id, account_type, status, is_active, created_at, updated_at)
            VALUES (:accountId, CAST(:accountType AS "AccountType"), 'ACTIVE'::"Status", true, :now, :now)
            """;
    private static final String INSERT_AUTHENTICATION = """
            INSERT INTO account_authentication(
                "accountId", username, email, password_hash, password_salt,
                auth_method, is_verified, is_active, created_at, updated_at
            ) VALUES (
                :accountId, :username, :email, :passwordHash, :passwordSalt,
                'EMAIL_PASSWORD'::"AuthMethod", false, true, :now, :now
            )
            """;
    private static final String INSERT_PROFILE = """
            INSERT INTO account_profiles(
                "accountId", name, avatar, phone, address, timezone, language, created_at, updated_at
            ) VALUES (
                :accountId, :name, :avatar, :phone, :address, :timezone, :language, :now, :now
            )
            """;
    private static final String INSERT_SECURITY = """
            INSERT INTO account_security(
                "accountId", roles, permissions, backup_codes, created_at, updated_at
            ) VALUES (
                :accountId, CAST(:roles AS text[]), CAST(:permissions AS text[]),
                ARRAY[]::text[], :now, :now
            )
            """;
    private static final String INSERT_PREFERENCES = """
            INSERT INTO account_preferences(
                "accountId", email_notifications, sms_notifications, push_notifications,
                profile_visibility, data_sharing, theme, language, currency, created_at, updated_at
            ) VALUES (
                :accountId, :emailNotifications, :smsNotifications, :pushNotifications,
                :profileVisibility, :dataSharing, :theme, :language, :currency, :now, :now
            )
            """;
    private static final String INSERT_USER_BEHAVIOR = """
            INSERT INTO user_behavior(
                "accountId", loyalty_points, membership_tier, sex, preferences,
                date_of_birth, created_at, updated_at
            ) VALUES (
                :accountId, 0, 'bronze', CAST(:sex AS "Sex"), '{}'::jsonb,
                :dateOfBirth, :now, :now
            )
            """;
    private static final String INSERT_NOTIFICATION_THREAD = """
            INSERT INTO notification_threads(
                id, noti_thread_user_id, is_active, created_at, updated_at
            ) VALUES (:threadId, :accountId, true, :now, :now)
            """;
    private static final String INSERT_SHOP_BUSINESS = """
            INSERT INTO shop_business(
                "accountId", business_name, business_type, tax_id, business_address,
                created_at, updated_at
            ) VALUES (
                :accountId, :businessName, :businessType, :taxId, :businessAddress,
                :now, :now
            )
            """;

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final TransactionTemplate transactionTemplate;
    private final LegacyPasswordHasher passwordHasher;
    private final LegacyTokenIssuer tokenIssuer;
    private final TokenDigester tokenDigester;
    private final AuthSessionStore sessionStore;
    private final SecureRandom secureRandom;
    private final Clock clock;

    public JdbcAccountRegistrationService(
            NamedParameterJdbcTemplate jdbcTemplate,
            TransactionTemplate transactionTemplate,
            LegacyPasswordHasher passwordHasher,
            LegacyTokenIssuer tokenIssuer,
            TokenDigester tokenDigester,
            AuthSessionStore sessionStore,
            SecureRandom secureRandom,
            Clock clock
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.transactionTemplate = transactionTemplate;
        this.passwordHasher = passwordHasher;
        this.tokenIssuer = tokenIssuer;
        this.tokenDigester = tokenDigester;
        this.sessionStore = sessionStore;
        this.secureRandom = secureRandom;
        this.clock = clock;
    }

    @Override
    public UserRegistrationResponse registerUser(UserRegistrationCommand command) {
        PreparedRegistration registration = prepare(command.email(), command.password(), ActorType.USER);
        String threadId = UUID.randomUUID().toString();
        MapSqlParameterSource parameters = baseParameters(
                registration,
                command.username(),
                command.name(),
                command.avatar(),
                command.phone(),
                command.address(),
                command.timezone(),
                defaultValue(command.language(), "en")
        ).addValue("roles", "{USER}")
                .addValue("permissions", "{user:read,user:write}")
                .addValue("emailNotifications", command.emailNotifications())
                .addValue("smsNotifications", command.smsNotifications())
                .addValue("pushNotifications", command.pushNotifications())
                .addValue("profileVisibility", defaultValue(command.profileVisibility(), "public"))
                .addValue("dataSharing", command.dataSharing())
                .addValue("theme", defaultValue(command.theme(), "light"))
                .addValue("currency", defaultValue(command.currency(), "USD"))
                .addValue("sex", defaultValue(command.sex(), "FEMALE"))
                .addValue("dateOfBirth", Timestamp.valueOf(dateOfBirth(command.dateOfBirth()).atStartOfDay()))
                .addValue("threadId", threadId);

        executeRegistration(parameters, () -> {
            jdbcTemplate.update(INSERT_USER_BEHAVIOR, parameters);
            jdbcTemplate.update(INSERT_NOTIFICATION_THREAD, parameters);
        }, command.deviceName(), registration);
        return new UserRegistrationResponse(
                new AccountIdentityResponse(registration.credential().accountId()),
                new NotificationThreadResponse(threadId),
                registration.tokens().accessToken(),
                registration.tokens().refreshToken()
        );
    }

    @Override
    public ShopLoginResponse registerShop(ShopRegistrationCommand command) {
        PreparedRegistration registration = prepare(command.email(), command.password(), ActorType.SHOP);
        MapSqlParameterSource parameters = baseParameters(
                registration,
                command.username(),
                command.name(),
                null,
                command.phone(),
                command.address(),
                command.timezone(),
                defaultValue(command.language(), "en")
        ).addValue("roles", "{SHOP}")
                .addValue("permissions", "{shop:manage,product:manage,order:manage}")
                .addValue("emailNotifications", command.emailNotifications())
                .addValue("smsNotifications", command.smsNotifications())
                .addValue("pushNotifications", command.pushNotifications())
                .addValue("profileVisibility", "public")
                .addValue("dataSharing", false)
                .addValue("theme", defaultValue(command.theme(), "light"))
                .addValue("currency", defaultValue(command.currency(), "USD"))
                .addValue("businessName", command.businessName().trim())
                .addValue("businessType", command.businessType().trim())
                .addValue("taxId", normalizeOptional(command.taxId()))
                .addValue("businessAddress", normalizeOptional(command.businessAddress()));

        executeRegistration(
                parameters,
                () -> jdbcTemplate.update(INSERT_SHOP_BUSINESS, parameters),
                null,
                registration
        );
        return new ShopLoginResponse(
                new AccountIdentityResponse(registration.credential().accountId()),
                registration.tokens().accessToken(),
                registration.tokens().refreshToken()
        );
    }

    private PreparedRegistration prepare(String email, String password, ActorType actorType) {
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        String accountId = UUID.randomUUID().toString();
        String deviceId = UUID.randomUUID().toString();
        String salt = randomHex(32);
        char[] passwordCharacters = password.toCharArray();
        String hash;
        try {
            hash = passwordHasher.hash(passwordCharacters, salt);
        } finally {
            Arrays.fill(passwordCharacters, '\0');
        }
        VerifiedCredential credential = new VerifiedCredential(accountId, normalizedEmail, actorType);
        return new PreparedRegistration(
                credential,
                deviceId,
                hash,
                salt,
                tokenIssuer.issue(credential, deviceId)
        );
    }

    private MapSqlParameterSource baseParameters(
            PreparedRegistration registration,
            String username,
            String name,
            String avatar,
            String phone,
            String address,
            String timezone,
            String language
    ) {
        return new MapSqlParameterSource()
                .addValue("accountId", registration.credential().accountId())
                .addValue("accountType", registration.credential().actorType().name())
                .addValue("email", registration.credential().email())
                .addValue("username", normalizeOptional(username))
                .addValue("passwordHash", registration.passwordHash())
                .addValue("passwordSalt", registration.passwordSalt())
                .addValue("name", name.trim())
                .addValue("avatar", normalizeOptional(avatar))
                .addValue("phone", normalizeOptional(phone))
                .addValue("address", normalizeOptional(address))
                .addValue("timezone", normalizeOptional(timezone))
                .addValue("language", language)
                .addValue("now", clock.millis());
    }

    private void executeRegistration(
            MapSqlParameterSource parameters,
            Runnable actorSpecificInserts,
            String deviceName,
            PreparedRegistration registration
    ) {
        try {
            transactionTemplate.executeWithoutResult(status -> {
                jdbcTemplate.update(INSERT_ACCOUNT, parameters);
                jdbcTemplate.update(INSERT_AUTHENTICATION, parameters);
                jdbcTemplate.update(INSERT_PROFILE, parameters);
                jdbcTemplate.update(INSERT_SECURITY, parameters);
                jdbcTemplate.update(INSERT_PREFERENCES, parameters);
                actorSpecificInserts.run();
                sessionStore.persistLogin(
                        registration.credential(),
                        registration.deviceId(),
                        normalizeOptional(deviceName),
                        registration.tokens(),
                        tokenDigester.digest(registration.tokens().refreshToken())
                );
            });
        } catch (DuplicateKeyException exception) {
            throw new ApplicationException(
                    HttpStatus.CONFLICT,
                    "ACCOUNT_ALREADY_EXISTS",
                    "An account with the supplied identity already exists."
            );
        }
    }

    private LocalDate dateOfBirth(LocalDate value) {
        return value == null ? LocalDate.ofEpochDay(0) : value;
    }

    private String defaultValue(String value, String fallback) {
        String normalized = normalizeOptional(value);
        return normalized == null ? fallback : normalized;
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String randomHex(int byteCount) {
        byte[] value = new byte[byteCount];
        secureRandom.nextBytes(value);
        return HexFormat.of().formatHex(value);
    }

    private record PreparedRegistration(
            VerifiedCredential credential,
            String deviceId,
            String passwordHash,
            String passwordSalt,
            IssuedTokenPair tokens
    ) {
    }
}
