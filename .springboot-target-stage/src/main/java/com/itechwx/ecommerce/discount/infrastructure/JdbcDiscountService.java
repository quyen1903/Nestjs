package com.itechwx.ecommerce.discount.infrastructure;

import com.itechwx.ecommerce.discount.application.CreateDiscountCommand;
import com.itechwx.ecommerce.discount.application.DiscountProductView;
import com.itechwx.ecommerce.discount.application.DiscountQuote;
import com.itechwx.ecommerce.discount.application.DiscountService;
import com.itechwx.ecommerce.discount.application.DiscountView;
import com.itechwx.ecommerce.eventing.application.DomainEventOutbox;
import com.itechwx.ecommerce.shared.error.ApplicationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.support.SqlArrayValue;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Array;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

public final class JdbcDiscountService implements DiscountService {

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final TransactionTemplate transactionTemplate;
    private final Clock clock;
    private final DomainEventOutbox eventOutbox;

    public JdbcDiscountService(
            NamedParameterJdbcTemplate jdbcTemplate,
            TransactionTemplate transactionTemplate,
            Clock clock
    ) {
        this(jdbcTemplate, transactionTemplate, clock, DomainEventOutbox.disabled());
    }

    public JdbcDiscountService(
            NamedParameterJdbcTemplate jdbcTemplate,
            TransactionTemplate transactionTemplate,
            Clock clock,
            DomainEventOutbox eventOutbox
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.transactionTemplate = transactionTemplate;
        this.clock = clock;
        this.eventOutbox = eventOutbox;
    }

    @Override
    public DiscountView create(String shopId, CreateDiscountCommand command) {
        validateDefinition(command);
        requireActiveShop(shopId);
        if ("specific".equals(command.appliesTo())) {
            requireOwnedProducts(shopId, command.productIds());
        }
        String id = UUID.randomUUID().toString();
        MapSqlParameterSource parameters = new MapSqlParameterSource()
                .addValue("id", id)
                .addValue("name", command.name().trim())
                .addValue("description", command.description().trim())
                .addValue("type", command.type())
                .addValue("value", command.value())
                .addValue("code", normalizeCode(command.code()))
                .addValue("startsAt", Timestamp.from(command.startsAt()))
                .addValue("endsAt", Timestamp.from(command.endsAt()))
                .addValue("maxUses", command.maxUses())
                .addValue("maxUsesPerUser", command.maxUsesPerUser())
                .addValue("minimum", command.minimumOrderValue())
                .addValue("shopId", shopId)
                .addValue("appliesTo", command.appliesTo())
                .addValue("productIds", sqlArray(command.productIds()))
                .addValue("now", clock.millis());
        try {
            return transactionTemplate.execute(status -> {
                jdbcTemplate.update("""
                    INSERT INTO discounts(
                        id, discount_name, discount_description, discount_type, discount_value,
                        discount_code, discount_start_dates, discount_end_dates,
                        discount_max_uses, discount_uses_count, discount_users_used,
                        discount_max_uses_per_user, discount_min_order_value, discount_shop,
                        discount_is_active, discount_applies_to, discount_product_ids,
                        is_active, created_at, updated_at
                    ) VALUES (
                        :id, :name, :description, :type, :value,
                        :code, :startsAt, :endsAt, :maxUses, 0, ARRAY[]::text[],
                        :maxUsesPerUser, :minimum, :shopId, true,
                        CAST(:appliesTo AS "DiscountAppliesTo"), :productIds,
                        true, :now, :now
                    )
                    """, parameters);
                eventOutbox.discountCreated(
                        id,
                        command.name().trim(),
                        command.value(),
                        shopId
                );
                return requireDiscount(shopId, normalizeCode(command.code()), false);
            });
        } catch (DataIntegrityViolationException exception) {
            throw new ApplicationException(HttpStatus.CONFLICT, "DISCOUNT_EXISTS", "Discount code already exists.");
        }
    }

    @Override
    public List<DiscountView> listForShop(String shopId, int page, int limit) {
        return jdbcTemplate.query("""
                SELECT * FROM discounts
                 WHERE discount_shop = :shopId
                   AND discount_is_active = true AND is_active = true
                 ORDER BY created_at, id
                 LIMIT :limit OFFSET :offset
                """, new MapSqlParameterSource()
                .addValue("shopId", shopId)
                .addValue("limit", limit)
                .addValue("offset", (page - 1) * limit),
                (resultSet, rowNumber) -> mapDiscount(resultSet));
    }

    @Override
    public List<DiscountProductView> listEligibleProducts(String shopId, String code) {
        DiscountView discount = requireDiscount(shopId, normalizeCode(code), false);
        String scope = "all".equals(discount.appliesTo())
                ? ""
                : " AND (product.id IN (:productIds) OR sku.id IN (:productIds))";
        return jdbcTemplate.query("""
                SELECT DISTINCT product.id, product.name, product.images,
                       product."shopBusinessId" AS shop_id
                  FROM "Spu" product
                  LEFT JOIN "Sku" sku ON sku."spuId" = product.id AND sku.is_active = true
                 WHERE product."shopBusinessId" = :shopId
                   AND product.status = 1 AND product."isMarketable" = true
                   AND product.is_active = true
                """ + scope + " ORDER BY product.name, product.id LIMIT 50",
                new MapSqlParameterSource()
                        .addValue("shopId", shopId)
                        .addValue("productIds", discount.productIds()),
                (resultSet, rowNumber) -> new DiscountProductView(
                        resultSet.getString("id"), resultSet.getString("name"),
                        stringList(resultSet.getArray("images")), resultSet.getString("shop_id")
                ));
    }

    @Override
    public DiscountQuote quoteCart(String userId, String shopId, String code, List<String> productIds) {
        return calculate(userId, shopId, normalizeCode(code), productIds, false);
    }

    @Override
    public DiscountQuote consume(String userId, String shopId, String code, List<String> productIds) {
        return transactionTemplate.execute(status -> calculate(
                userId, shopId, normalizeCode(code), productIds, true
        ));
    }

    @Override
    public void delete(String shopId, String code) {
        int count = jdbcTemplate.update("""
                UPDATE discounts
                   SET discount_is_active = false, updated_at = :now
                 WHERE discount_code = :code AND discount_shop = :shopId
                   AND discount_is_active = true AND is_active = true
                """, new MapSqlParameterSource()
                .addValue("shopId", shopId)
                .addValue("code", normalizeCode(code))
                .addValue("now", clock.millis()));
        if (count != 1) {
            throw new ApplicationException(HttpStatus.NOT_FOUND, "DISCOUNT_NOT_FOUND", "Discount not found.");
        }
    }

    private DiscountQuote calculate(
            String userId,
            String shopId,
            String code,
            List<String> requestedProductIds,
            boolean consume
    ) {
        DiscountRow row = discountRow(shopId, code, consume);
        Instant now = clock.instant();
        if (!row.active() || now.isBefore(row.startsAt()) || now.isAfter(row.endsAt())) {
            throw new ApplicationException(HttpStatus.CONFLICT, "DISCOUNT_EXPIRED", "Discount is not active.");
        }
        if (row.usesCount() >= row.maxUses()) {
            throw new ApplicationException(HttpStatus.CONFLICT, "DISCOUNT_EXHAUSTED", "Discount usage limit reached.");
        }
        long userUses = row.usersUsed().stream().filter(userId::equals).count();
        if (row.maxUsesPerUser() > 0 && userUses >= row.maxUsesPerUser()) {
            throw new ApplicationException(HttpStatus.CONFLICT, "DISCOUNT_USER_LIMIT", "User discount limit reached.");
        }
        Set<String> selected = new HashSet<>(requestedProductIds);
        if (selected.isEmpty() || selected.size() != requestedProductIds.size()) {
            throw new ApplicationException(HttpStatus.BAD_REQUEST, "INVALID_DISCOUNT_PRODUCTS", "Select unique cart products.");
        }
        List<CartPrice> prices = jdbcTemplate.query("""
                SELECT item."cart_product_productId" AS product_id,
                       item.cart_product_quantity AS quantity,
                       sku.price,
                       sku."spuId" AS spu_id
                  FROM carts cart
                  JOIN cart_products item ON item."cart_product_cartId" = cart.id
                  JOIN "Sku" sku ON sku.id = item."cart_product_productId" AND sku.is_active = true
                 WHERE cart."cart_userId" = :userId AND cart.is_active = true
                   AND item.is_active = true
                   AND item."cart_product_shopId" = :shopId
                   AND item."cart_product_productId" IN (:productIds)
                """, new MapSqlParameterSource()
                .addValue("userId", userId).addValue("shopId", shopId)
                .addValue("productIds", List.copyOf(selected)),
                (resultSet, rowNumber) -> new CartPrice(
                        resultSet.getString("product_id"), resultSet.getString("spu_id"),
                        resultSet.getInt("quantity"), resultSet.getLong("price")
                ));
        if (prices.size() != selected.size()) {
            throw new ApplicationException(HttpStatus.BAD_REQUEST, "INVALID_DISCOUNT_PRODUCTS", "Products must belong to the user's cart and shop.");
        }
        if ("specific".equals(row.appliesTo())) {
            Set<String> eligible = Set.copyOf(row.productIds());
            boolean invalid = prices.stream().anyMatch(item ->
                    !eligible.contains(item.productId()) && !eligible.contains(item.spuId()));
            if (invalid) {
                throw new ApplicationException(HttpStatus.CONFLICT, "DISCOUNT_PRODUCT_SCOPE", "Discount does not apply to a selected product.");
            }
        }
        BigDecimal subtotal = prices.stream()
                .map(item -> BigDecimal.valueOf(item.price()).multiply(BigDecimal.valueOf(item.quantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (subtotal.compareTo(row.minimum()) < 0) {
            throw new ApplicationException(HttpStatus.CONFLICT, "DISCOUNT_MINIMUM", "Cart does not meet the discount minimum.");
        }
        BigDecimal amount = "fixed_amount".equals(row.type())
                ? row.value().min(subtotal)
                : subtotal.multiply(row.value()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        amount = amount.max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
        DiscountQuote quote = new DiscountQuote(
                subtotal.setScale(2, RoundingMode.HALF_UP), amount,
                subtotal.subtract(amount).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP)
        );
        if (consume) {
            int updated = jdbcTemplate.update("""
                    UPDATE discounts
                       SET discount_uses_count = discount_uses_count + 1,
                           discount_users_used = array_append(discount_users_used, :userId),
                           updated_at = :now
                     WHERE id = :id AND discount_uses_count = :usesCount
                    """, new MapSqlParameterSource()
                    .addValue("id", row.id()).addValue("usesCount", row.usesCount())
                    .addValue("userId", userId).addValue("now", clock.millis()));
            if (updated != 1) {
                throw new ApplicationException(HttpStatus.CONFLICT, "DISCOUNT_CONCURRENT_USE", "Discount changed; retry checkout.");
            }
        }
        return quote;
    }

    private DiscountRow discountRow(String shopId, String code, boolean lock) {
        List<DiscountRow> rows = jdbcTemplate.query("""
                SELECT id, discount_type, discount_value, discount_start_dates,
                       discount_end_dates, discount_max_uses, discount_uses_count,
                       discount_users_used, discount_max_uses_per_user,
                       discount_min_order_value, discount_is_active,
                       discount_applies_to::text AS applies_to, discount_product_ids
                  FROM discounts
                 WHERE discount_shop = :shopId AND discount_code = :code AND is_active = true
                """ + (lock ? " FOR UPDATE" : ""), new MapSqlParameterSource()
                .addValue("shopId", shopId).addValue("code", code),
                (resultSet, rowNumber) -> new DiscountRow(
                        resultSet.getString("id"), resultSet.getString("discount_type"),
                        BigDecimal.valueOf(resultSet.getDouble("discount_value")),
                        resultSet.getTimestamp("discount_start_dates").toInstant(),
                        resultSet.getTimestamp("discount_end_dates").toInstant(),
                        resultSet.getInt("discount_max_uses"), resultSet.getInt("discount_uses_count"),
                        stringList(resultSet.getArray("discount_users_used")),
                        resultSet.getInt("discount_max_uses_per_user"),
                        BigDecimal.valueOf(resultSet.getDouble("discount_min_order_value")),
                        resultSet.getBoolean("discount_is_active"), resultSet.getString("applies_to"),
                        stringList(resultSet.getArray("discount_product_ids"))
                ));
        if (rows.isEmpty()) {
            throw new ApplicationException(HttpStatus.NOT_FOUND, "DISCOUNT_NOT_FOUND", "Discount not found.");
        }
        return rows.getFirst();
    }

    private DiscountView requireDiscount(String shopId, String code, boolean lock) {
        List<DiscountView> rows = jdbcTemplate.query("""
                SELECT * FROM discounts
                 WHERE discount_shop = :shopId AND discount_code = :code AND is_active = true
                """ + (lock ? " FOR UPDATE" : ""), new MapSqlParameterSource()
                .addValue("shopId", shopId).addValue("code", code),
                (resultSet, rowNumber) -> mapDiscount(resultSet));
        if (rows.isEmpty()) {
            throw new ApplicationException(HttpStatus.NOT_FOUND, "DISCOUNT_NOT_FOUND", "Discount not found.");
        }
        return rows.getFirst();
    }

    private DiscountView mapDiscount(java.sql.ResultSet resultSet) throws SQLException {
        return new DiscountView(
                resultSet.getString("id"), resultSet.getString("discount_name"),
                resultSet.getString("discount_description"), resultSet.getString("discount_type"),
                BigDecimal.valueOf(resultSet.getDouble("discount_value")), resultSet.getString("discount_code"),
                resultSet.getTimestamp("discount_start_dates").toInstant(),
                resultSet.getTimestamp("discount_end_dates").toInstant(),
                resultSet.getInt("discount_max_uses"), resultSet.getInt("discount_uses_count"),
                resultSet.getInt("discount_max_uses_per_user"),
                BigDecimal.valueOf(resultSet.getDouble("discount_min_order_value")),
                resultSet.getString("discount_shop"), resultSet.getString("discount_applies_to"),
                stringList(resultSet.getArray("discount_product_ids"))
        );
    }

    private void validateDefinition(CreateDiscountCommand command) {
        if (!command.startsAt().isBefore(command.endsAt()) || !command.endsAt().isAfter(clock.instant())) {
            throw new ApplicationException(HttpStatus.BAD_REQUEST, "INVALID_DISCOUNT_DATES", "Discount dates are invalid.");
        }
        if (command.value().signum() <= 0 || command.maxUses() <= 0 || command.maxUsesPerUser() < 0
                || command.minimumOrderValue().signum() < 0) {
            throw new ApplicationException(HttpStatus.BAD_REQUEST, "INVALID_DISCOUNT", "Discount values are invalid.");
        }
        if (!Set.of("fixed_amount", "percentage").contains(command.type())
                || !Set.of("all", "specific").contains(command.appliesTo())
                || ("percentage".equals(command.type()) && command.value().compareTo(BigDecimal.valueOf(100)) > 0)
                || ("specific".equals(command.appliesTo()) && command.productIds().isEmpty())) {
            throw new ApplicationException(HttpStatus.BAD_REQUEST, "INVALID_DISCOUNT", "Discount definition is invalid.");
        }
    }

    private void requireActiveShop(String shopId) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT count(*) FROM shop_business shop JOIN accounts account ON account.id = shop."accountId"
                 WHERE shop."accountId" = :shopId AND account.is_active = true
                   AND account.account_type = 'SHOP'::"AccountType"
                """, new MapSqlParameterSource("shopId", shopId), Integer.class);
        if (count == null || count != 1) {
            throw new ApplicationException(HttpStatus.FORBIDDEN, "SHOP_NOT_ACTIVE", "An active shop is required.");
        }
    }

    private void requireOwnedProducts(String shopId, List<String> ids) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT count(DISTINCT requested.id)
                  FROM unnest(CAST(:ids AS text[])) requested(id)
                 WHERE EXISTS (
                     SELECT 1 FROM "Spu" product LEFT JOIN "Sku" sku ON sku."spuId" = product.id
                      WHERE product."shopBusinessId" = :shopId AND product.is_active = true
                        AND (product.id = requested.id OR sku.id = requested.id)
                 )
                """, new MapSqlParameterSource()
                .addValue("ids", sqlArray(ids)).addValue("shopId", shopId), Integer.class);
        if (count == null || count != new HashSet<>(ids).size() || count != ids.size()) {
            throw new ApplicationException(HttpStatus.BAD_REQUEST, "INVALID_DISCOUNT_PRODUCTS", "Products must belong to the shop.");
        }
    }

    private String normalizeCode(String code) {
        return code.trim().toUpperCase(Locale.ROOT);
    }

    private SqlArrayValue sqlArray(List<String> values) {
        return new SqlArrayValue("text", (Object[]) values.toArray(String[]::new));
    }

    private List<String> stringList(Array array) throws SQLException {
        if (array == null) return List.of();
        try {
            return List.copyOf(Arrays.asList((String[]) array.getArray()));
        } finally {
            array.free();
        }
    }

    private record CartPrice(String productId, String spuId, int quantity, long price) {
    }

    private record DiscountRow(
            String id, String type, BigDecimal value, Instant startsAt, Instant endsAt,
            int maxUses, int usesCount, List<String> usersUsed, int maxUsesPerUser,
            BigDecimal minimum, boolean active, String appliesTo, List<String> productIds
    ) {
    }
}
