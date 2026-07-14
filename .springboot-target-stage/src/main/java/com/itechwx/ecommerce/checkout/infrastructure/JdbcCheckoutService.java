package com.itechwx.ecommerce.checkout.infrastructure;

import com.itechwx.ecommerce.checkout.application.CheckoutCommand;
import com.itechwx.ecommerce.checkout.application.CheckoutProductSelection;
import com.itechwx.ecommerce.checkout.application.CheckoutProductView;
import com.itechwx.ecommerce.checkout.application.CheckoutReviewView;
import com.itechwx.ecommerce.checkout.application.CheckoutService;
import com.itechwx.ecommerce.checkout.application.CheckoutShopSelection;
import com.itechwx.ecommerce.checkout.application.CheckoutTotals;
import com.itechwx.ecommerce.checkout.application.CreateOrdersResult;
import com.itechwx.ecommerce.checkout.application.OrderView;
import com.itechwx.ecommerce.checkout.application.ShopCheckoutView;
import com.itechwx.ecommerce.discount.application.DiscountQuote;
import com.itechwx.ecommerce.discount.application.DiscountService;
import com.itechwx.ecommerce.inventory.application.InventoryReservationService;
import com.itechwx.ecommerce.inventory.application.ReservationRequest;
import com.itechwx.ecommerce.shared.error.ApplicationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.support.SqlArrayValue;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

public final class JdbcCheckoutService implements CheckoutService {

    private static final Duration ORDER_HOLD = Duration.ofMinutes(15);
    private static final Pattern IDEMPOTENCY_KEY = Pattern.compile("[\\x21-\\x7E]{1,255}");

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final TransactionTemplate transactionTemplate;
    private final InventoryReservationService reservationService;
    private final DiscountService discountService;
    private final Clock clock;

    public JdbcCheckoutService(
            NamedParameterJdbcTemplate jdbcTemplate,
            TransactionTemplate transactionTemplate,
            InventoryReservationService reservationService,
            DiscountService discountService,
            Clock clock
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.transactionTemplate = transactionTemplate;
        this.reservationService = reservationService;
        this.discountService = discountService;
        this.clock = clock;
    }

    @Override
    public CheckoutReviewView review(String userId, CheckoutCommand command) {
        return transactionTemplate.execute(status -> buildReview(userId, command, false));
    }

    @Override
    public CreateOrdersResult createOrders(
            String userId,
            String suppliedIdempotencyKey,
            CheckoutCommand command
    ) {
        String fingerprint = fingerprint(command);
        return transactionTemplate.execute(status -> createInTransaction(
                userId, suppliedIdempotencyKey, fingerprint, command
        ));
    }

    private CreateOrdersResult createInTransaction(
            String userId,
            String suppliedIdempotencyKey,
            String fingerprint,
            CheckoutCommand command
    ) {
        CartVersion cartVersion = cartVersion(command.cartId(), userId);
        String idempotencyKey = normalizeIdempotencyKey(
                suppliedIdempotencyKey,
                command.cartId(),
                cartVersion.updatedAt(),
                fingerprint
        );
        jdbcTemplate.query(
                "SELECT pg_advisory_xact_lock(hashtextextended(:key, 0))",
                new MapSqlParameterSource("key", userId + ":" + idempotencyKey),
                resultSet -> null
        );
        CheckoutCommandRow existing = checkoutCommand(userId, idempotencyKey);
        if (existing != null) {
            if (!existing.fingerprint().equals(fingerprint)) {
                throw new ApplicationException(
                        HttpStatus.CONFLICT,
                        "IDEMPOTENCY_CONFLICT",
                        "The idempotency key was already used for a different checkout."
                );
            }
            if ("COMPLETED".equals(existing.status())) {
                List<OrderView> orders = ordersByIds(userId, existing.orderIds());
                return result(orders);
            }
            throw new ApplicationException(
                    HttpStatus.CONFLICT,
                    "CHECKOUT_IN_PROGRESS",
                    "Checkout is already in progress."
            );
        }

        CheckoutReviewView review = buildReview(userId, command, true);
        String shippingAddress = shippingAddress(userId, command.shippingAddress());
        String commandId = UUID.randomUUID().toString();
        jdbcTemplate.update("""
                INSERT INTO checkout_commands(
                    id, user_id, idempotency_key, request_fingerprint,
                    order_ids, status, created_at, updated_at
                ) VALUES (
                    :id, :userId, :key, :fingerprint,
                    ARRAY[]::text[], 'PROCESSING', :now, :now
                )
                """, new MapSqlParameterSource()
                .addValue("id", commandId)
                .addValue("userId", userId)
                .addValue("key", idempotencyKey)
                .addValue("fingerprint", fingerprint)
                .addValue("now", clock.millis()));

        List<OrderView> orders = new ArrayList<>();
        for (ShopCheckoutView shop : review.reviewedOrders()) {
            String orderId = UUID.randomUUID().toString();
            Instant expiresAt = clock.instant().plus(ORDER_HOLD);
            BigDecimal discount = money(shop.priceRaw().subtract(shop.priceApplyDiscount()));
            jdbcTemplate.update("""
                    INSERT INTO orders(
                        id, user_id, status, "total_discount ", shipping_fee,
                        shipping_street, total_price, payment_info,
                        payment_intent_id, expired_at, is_active,
                        "shopBusinessId", created_at, updated_at
                    ) VALUES (
                        :id, :userId, CAST('PENDING' AS "OrderStatus"), :discount, 0,
                        :shippingAddress, :totalPrice,
                        CAST('{"provider":"stripe","status":"pending"}' AS jsonb),
                        NULL, :expiresAt, true, :shopId, :now, :now
                    )
                    """, new MapSqlParameterSource()
                    .addValue("id", orderId)
                    .addValue("userId", userId)
                    .addValue("discount", discount)
                    .addValue("shippingAddress", shippingAddress)
                    .addValue("totalPrice", money(shop.priceApplyDiscount()))
                    .addValue("expiresAt", Timestamp.from(expiresAt))
                    .addValue("shopId", shop.shopId())
                    .addValue("now", clock.millis()));

            reservationService.reserveForOrder(
                    userId,
                    orderId,
                    shop.itemProducts().stream()
                            .map(item -> new ReservationRequest(item.productId(), item.quantity()))
                            .toList()
            );
            for (CheckoutProductView item : shop.itemProducts()) {
                CartItem state = requireProductState(item.productId());
                jdbcTemplate.update("""
                        INSERT INTO order_items(
                            id, "orderId", "inventoryId", quantity, price,
                            is_active, created_at, updated_at
                        ) VALUES (
                            :id, :orderId, :inventoryId, :quantity, :price,
                            true, :now, :now
                        )
                        """, new MapSqlParameterSource()
                        .addValue("id", UUID.randomUUID().toString())
                        .addValue("orderId", orderId)
                        .addValue("inventoryId", state.inventoryId())
                        .addValue("quantity", item.quantity())
                        .addValue("price", item.price().intValueExact())
                        .addValue("now", clock.millis()));
            }
            orders.add(new OrderView(
                    orderId, userId, shop.shopId(), "PENDING", discount,
                    money(BigDecimal.ZERO), shippingAddress,
                    money(shop.priceApplyDiscount()), null, expiresAt
            ));
        }

        jdbcTemplate.update("DELETE FROM cart_products WHERE \"cart_product_cartId\" = :cartId",
                new MapSqlParameterSource("cartId", command.cartId()));
        jdbcTemplate.update("""
                UPDATE carts
                   SET cart_count_product = 0, updated_at = :now
                 WHERE id = :cartId AND "cart_userId" = :userId
                """, new MapSqlParameterSource()
                .addValue("cartId", command.cartId())
                .addValue("userId", userId)
                .addValue("now", clock.millis()));
        jdbcTemplate.update("""
                UPDATE checkout_commands
                   SET order_ids = :orderIds, status = 'COMPLETED', updated_at = :now
                 WHERE id = :id AND status = 'PROCESSING'
                """, new MapSqlParameterSource()
                .addValue("orderIds", new SqlArrayValue("text", orders.stream().map(OrderView::id).toArray()))
                .addValue("now", clock.millis())
                .addValue("id", commandId));
        return result(orders);
    }

    private CheckoutReviewView buildReview(
            String userId,
            CheckoutCommand command,
            boolean consumeDiscounts
    ) {
        CartState cart = loadCart(command.cartId(), userId, consumeDiscounts);
        Map<String, CartItem> cartByProduct = new LinkedHashMap<>();
        for (CartItem item : cart.items()) {
            cartByProduct.put(item.productId(), item);
        }
        validateExactSelection(command.shops(), cartByProduct);

        List<ShopCheckoutView> shops = new ArrayList<>();
        List<CheckoutShopSelection> orderedShops = command.shops().stream()
                .sorted(Comparator.comparing(CheckoutShopSelection::shopId))
                .toList();
        for (CheckoutShopSelection selection : orderedShops) {
            List<CartItem> selectedItems = selection.products().stream()
                    .map(product -> cartByProduct.get(product.productId()))
                    .sorted(Comparator.comparing(CartItem::productId))
                    .toList();
            for (CartItem item : selectedItems) {
                if (item.inventoryId() == null || item.stock() < item.quantity()) {
                    throw new ApplicationException(
                            HttpStatus.CONFLICT,
                            "INSUFFICIENT_STOCK",
                            "Not enough stock is available."
                    );
                }
            }
            BigDecimal subtotal = selectedItems.stream()
                    .map(item -> item.price().multiply(BigDecimal.valueOf(item.quantity())))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            List<String> discountCodes = selection.discountCodes().stream()
                    .map(code -> code.trim().toUpperCase(Locale.ROOT))
                    .sorted()
                    .toList();
            if (new HashSet<>(discountCodes).size() != discountCodes.size()) {
                throw new ApplicationException(
                        HttpStatus.BAD_REQUEST,
                        "DUPLICATE_DISCOUNT",
                        "Duplicate discount codes are not allowed."
                );
            }
            BigDecimal discountAmount = BigDecimal.ZERO;
            List<String> productIds = selectedItems.stream().map(CartItem::productId).toList();
            for (String code : discountCodes) {
                DiscountQuote quote = consumeDiscounts
                        ? discountService.consume(userId, selection.shopId(), code, productIds)
                        : discountService.quoteCart(userId, selection.shopId(), code, productIds);
                discountAmount = discountAmount.add(quote.discount());
            }
            discountAmount = discountAmount.min(subtotal).max(BigDecimal.ZERO);
            BigDecimal payable = subtotal.subtract(discountAmount).max(BigDecimal.ZERO);
            shops.add(new ShopCheckoutView(
                    selection.shopId(),
                    discountCodes,
                    money(subtotal),
                    money(payable),
                    selectedItems.stream().map(item -> new CheckoutProductView(
                            item.productId(), item.name(), item.shopId(), item.quantity(), money(item.price())
                    )).toList()
            ));
        }
        BigDecimal totalPrice = shops.stream().map(ShopCheckoutView::priceRaw)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCheckout = shops.stream().map(ShopCheckoutView::priceApplyDiscount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        CheckoutTotals totals = new CheckoutTotals(
                money(totalPrice),
                money(BigDecimal.ZERO),
                money(totalPrice.subtract(totalCheckout)),
                money(totalCheckout)
        );
        return new CheckoutReviewView(shops, shops, totals);
    }

    private CartState loadCart(String cartId, String userId, boolean lock) {
        List<CartVersion> carts = jdbcTemplate.query("""
                SELECT id, updated_at
                  FROM carts
                 WHERE id = :cartId AND "cart_userId" = :userId
                   AND is_active = true AND cart_state = CAST('ACTIVE' AS "CartState")
                """ + (lock ? " FOR UPDATE" : ""), new MapSqlParameterSource()
                .addValue("cartId", cartId)
                .addValue("userId", userId), (resultSet, rowNumber) ->
                new CartVersion(resultSet.getString("id"), resultSet.getLong("updated_at")));
        if (carts.isEmpty()) {
            throw new ApplicationException(HttpStatus.NOT_FOUND, "CART_NOT_FOUND", "Cart not found.");
        }
        Integer activeCount = jdbcTemplate.queryForObject("""
                SELECT count(*)
                  FROM cart_products
                 WHERE "cart_product_cartId" = :cartId AND is_active = true
                """, new MapSqlParameterSource("cartId", cartId), Integer.class);
        List<CartItem> items = jdbcTemplate.query("""
                SELECT item."cart_product_productId" AS product_id,
                       item.cart_product_quantity AS quantity,
                       sku.name, sku.price, product."shopBusinessId" AS shop_id,
                       inventory.id AS inventory_id,
                       COALESCE(inventory.inventory_stock, 0) AS inventory_stock
                  FROM cart_products item
                  JOIN "Sku" sku ON sku.id = item."cart_product_productId"
                                 AND sku.is_active = true AND sku.status = 1
                  JOIN "Spu" product ON product.id = sku."spuId"
                                     AND product.is_active = true
                                     AND product.status = 1
                                     AND product."isMarketable" = true
                  JOIN accounts shop ON shop.id = product."shopBusinessId"
                                    AND shop.account_type = CAST('SHOP' AS "AccountType")
                                    AND shop.status = CAST('ACTIVE' AS "Status")
                                    AND shop.is_active = true
                  LEFT JOIN inventories inventory
                         ON inventory.inventory_product_id = sku.id
                        AND inventory.is_active = true
                 WHERE item."cart_product_cartId" = :cartId AND item.is_active = true
                 ORDER BY item."cart_product_productId"
                """, new MapSqlParameterSource("cartId", cartId), (resultSet, rowNumber) -> new CartItem(
                resultSet.getString("product_id"),
                resultSet.getString("name"),
                resultSet.getString("shop_id"),
                resultSet.getInt("quantity"),
                BigDecimal.valueOf(resultSet.getLong("price")),
                resultSet.getString("inventory_id"),
                resultSet.getInt("inventory_stock")
        ));
        if (activeCount == null || activeCount == 0) {
            throw new ApplicationException(HttpStatus.CONFLICT, "CART_EMPTY", "Cart is empty.");
        }
        if (activeCount != items.size()) {
            throw new ApplicationException(
                    HttpStatus.CONFLICT,
                    "CART_ITEM_UNAVAILABLE",
                    "A cart item is no longer available."
            );
        }
        return new CartState(carts.getFirst(), items);
    }

    private void validateExactSelection(
            List<CheckoutShopSelection> selections,
            Map<String, CartItem> cartByProduct
    ) {
        Set<String> shops = new HashSet<>();
        Map<String, Integer> requested = new HashMap<>();
        for (CheckoutShopSelection shop : selections) {
            if (!shops.add(shop.shopId())) {
                throw invalidSelection("Each shop may appear only once.");
            }
            for (CheckoutProductSelection product : shop.products()) {
                if (requested.put(product.productId(), product.quantity()) != null) {
                    throw invalidSelection("Each product may appear only once.");
                }
                CartItem cartItem = cartByProduct.get(product.productId());
                if (cartItem == null
                        || !cartItem.shopId().equals(shop.shopId())
                        || cartItem.quantity() != product.quantity()) {
                    throw invalidSelection("Checkout must match the verified user's current cart.");
                }
            }
        }
        if (!requested.keySet().equals(cartByProduct.keySet())) {
            throw invalidSelection("Checkout must include the complete current cart.");
        }
    }

    private ApplicationException invalidSelection(String message) {
        return new ApplicationException(HttpStatus.BAD_REQUEST, "INVALID_CHECKOUT_SELECTION", message);
    }

    private String shippingAddress(String userId, String requested) {
        if (requested != null && !requested.isBlank()) {
            return requested.trim();
        }
        List<String> addresses = jdbcTemplate.query("""
                SELECT address FROM account_profiles
                 WHERE "accountId" = :userId AND address IS NOT NULL
                """, new MapSqlParameterSource("userId", userId),
                (resultSet, rowNumber) -> resultSet.getString("address"));
        if (addresses.isEmpty() || addresses.getFirst().isBlank()) {
            throw new ApplicationException(
                    HttpStatus.BAD_REQUEST,
                    "SHIPPING_ADDRESS_REQUIRED",
                    "A shipping address is required."
            );
        }
        return addresses.getFirst().trim();
    }

    private CartVersion cartVersion(String cartId, String userId) {
        List<CartVersion> versions = jdbcTemplate.query("""
                SELECT id, updated_at FROM carts
                 WHERE id = :cartId AND "cart_userId" = :userId AND is_active = true
                """, new MapSqlParameterSource()
                .addValue("cartId", cartId)
                .addValue("userId", userId), (resultSet, rowNumber) ->
                new CartVersion(resultSet.getString("id"), resultSet.getLong("updated_at")));
        if (versions.isEmpty()) {
            throw new ApplicationException(HttpStatus.NOT_FOUND, "CART_NOT_FOUND", "Cart not found.");
        }
        return versions.getFirst();
    }

    private CheckoutCommandRow checkoutCommand(String userId, String key) {
        List<CheckoutCommandRow> rows = jdbcTemplate.query("""
                SELECT request_fingerprint, order_ids, status
                  FROM checkout_commands
                 WHERE user_id = :userId AND idempotency_key = :key
                 FOR UPDATE
                """, new MapSqlParameterSource().addValue("userId", userId).addValue("key", key),
                (resultSet, rowNumber) -> new CheckoutCommandRow(
                        resultSet.getString("request_fingerprint"),
                        List.of((String[]) resultSet.getArray("order_ids").getArray()),
                        resultSet.getString("status")
                ));
        return rows.isEmpty() ? null : rows.getFirst();
    }

    private List<OrderView> ordersByIds(String userId, List<String> ids) {
        if (ids.isEmpty()) {
            return List.of();
        }
        List<OrderView> found = jdbcTemplate.query("""
                SELECT id, user_id, "shopBusinessId", status::text AS status,
                       "total_discount " AS total_discount, shipping_fee,
                       shipping_street, total_price, payment_intent_id, expired_at
                  FROM orders
                 WHERE user_id = :userId AND id IN (:ids)
                """, new MapSqlParameterSource().addValue("userId", userId).addValue("ids", ids),
                (resultSet, rowNumber) -> mapOrder(resultSet));
        Map<String, OrderView> byId = new HashMap<>();
        found.forEach(order -> byId.put(order.id(), order));
        List<OrderView> ordered = ids.stream().map(byId::get).filter(java.util.Objects::nonNull).toList();
        if (ordered.size() != ids.size()) {
            throw new ApplicationException(
                    HttpStatus.CONFLICT,
                    "CHECKOUT_REPLAY_UNAVAILABLE",
                    "The original checkout result is unavailable."
            );
        }
        return ordered;
    }

    private OrderView mapOrder(java.sql.ResultSet resultSet) throws java.sql.SQLException {
        return new OrderView(
                resultSet.getString("id"), resultSet.getString("user_id"),
                resultSet.getString("shopBusinessId"), resultSet.getString("status"),
                money(resultSet.getBigDecimal("total_discount")),
                money(resultSet.getBigDecimal("shipping_fee")),
                resultSet.getString("shipping_street"),
                money(resultSet.getBigDecimal("total_price")),
                resultSet.getString("payment_intent_id"),
                resultSet.getTimestamp("expired_at").toInstant()
        );
    }

    private CartItem requireProductState(String productId) {
        List<CartItem> rows = jdbcTemplate.query("""
                SELECT sku.id AS product_id, sku.name,
                       product."shopBusinessId" AS shop_id,
                       0 AS quantity,
                       sku.price, inventory.id AS inventory_id,
                       inventory.inventory_stock
                  FROM "Sku" sku
                  JOIN "Spu" product ON product.id = sku."spuId"
                  JOIN inventories inventory ON inventory.inventory_product_id = sku.id
                 WHERE sku.id = :productId AND sku.is_active = true
                """, new MapSqlParameterSource("productId", productId), (resultSet, rowNumber) -> new CartItem(
                resultSet.getString("product_id"), resultSet.getString("name"),
                resultSet.getString("shop_id"), resultSet.getInt("quantity"),
                BigDecimal.valueOf(resultSet.getLong("price")),
                resultSet.getString("inventory_id"), resultSet.getInt("inventory_stock")
        ));
        return rows.stream().findFirst().orElseThrow(() -> new ApplicationException(
                        HttpStatus.CONFLICT, "CART_ITEM_UNAVAILABLE", "A cart item is no longer available."
                ));
    }

    private String normalizeIdempotencyKey(
            String supplied,
            String cartId,
            long cartUpdatedAt,
            String fingerprint
    ) {
        String key = supplied == null || supplied.isBlank()
                ? "compat:" + cartId + ":" + cartUpdatedAt + ":" + fingerprint.substring(0, 16)
                : supplied.trim();
        if (!IDEMPOTENCY_KEY.matcher(key).matches()) {
            throw new ApplicationException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_IDEMPOTENCY_KEY",
                    "Idempotency-Key must contain 1 to 255 visible ASCII characters."
            );
        }
        return key;
    }

    private String fingerprint(CheckoutCommand command) {
        StringBuilder canonical = new StringBuilder();
        append(canonical, command.cartId());
        append(canonical, command.shippingAddress() == null ? "" : command.shippingAddress().trim());
        command.shops().stream().sorted(Comparator.comparing(CheckoutShopSelection::shopId)).forEach(shop -> {
            append(canonical, shop.shopId());
            shop.discountCodes().stream().map(code -> code.trim().toUpperCase(Locale.ROOT)).sorted()
                    .forEach(code -> append(canonical, code));
            shop.products().stream().sorted(Comparator.comparing(CheckoutProductSelection::productId))
                    .forEach(product -> {
                        append(canonical, product.productId());
                        append(canonical, Integer.toString(product.quantity()));
                    });
        });
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(canonical.toString().getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

    private void append(StringBuilder target, String value) {
        target.append(value.length()).append(':').append(value).append(';');
    }

    private CreateOrdersResult result(List<OrderView> orders) {
        return new CreateOrdersResult(orders, orders.size(), "Orders created successfully");
    }

    private BigDecimal money(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private record CartVersion(String id, long updatedAt) {
    }

    private record CartState(CartVersion cart, List<CartItem> items) {
    }

    private record CartItem(
            String productId,
            String name,
            String shopId,
            int quantity,
            BigDecimal price,
            String inventoryId,
            int stock
    ) {
    }

    private record CheckoutCommandRow(String fingerprint, List<String> orderIds, String status) {
    }
}
