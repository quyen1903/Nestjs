package com.itechwx.ecommerce.cart.infrastructure;

import com.itechwx.ecommerce.cart.application.CartItemView;
import com.itechwx.ecommerce.cart.application.CartService;
import com.itechwx.ecommerce.cart.application.CartUpdateItem;
import com.itechwx.ecommerce.shared.error.ApplicationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public final class JdbcCartService implements CartService {

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final TransactionTemplate transactionTemplate;
    private final Clock clock;

    public JdbcCartService(
            NamedParameterJdbcTemplate jdbcTemplate,
            TransactionTemplate transactionTemplate,
            Clock clock
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.transactionTemplate = transactionTemplate;
        this.clock = clock;
    }

    @Override
    public CartItemView add(String userId, String productId, int quantity) {
        return transactionTemplate.execute(status -> {
            ServerProduct product = requireProduct(productId);
            String cartId = getOrCreateCart(userId);
            MapSqlParameterSource parameters = new MapSqlParameterSource()
                    .addValue("id", UUID.randomUUID().toString())
                    .addValue("cartId", cartId)
                    .addValue("productId", product.id())
                    .addValue("shopId", product.shopId())
                    .addValue("quantity", quantity)
                    .addValue("name", product.name())
                    .addValue("price", product.price())
                    .addValue("now", clock.millis());
            jdbcTemplate.update("""
                    INSERT INTO cart_products(
                        id, "cart_product_productId", "cart_product_shopId",
                        cart_product_quantity, cart_product_name, cart_product_price,
                        "cart_product_cartId", is_active, created_at, updated_at
                    ) VALUES (
                        :id, :productId, :shopId, :quantity, :name, :price,
                        :cartId, true, :now, :now
                    )
                    ON CONFLICT ("cart_product_cartId", "cart_product_productId")
                    DO UPDATE SET
                        "cart_product_shopId" = EXCLUDED."cart_product_shopId",
                        cart_product_quantity = CASE
                            WHEN cart_products.is_active THEN cart_products.cart_product_quantity
                                + EXCLUDED.cart_product_quantity
                            ELSE EXCLUDED.cart_product_quantity
                        END,
                        cart_product_name = EXCLUDED.cart_product_name,
                        cart_product_price = EXCLUDED.cart_product_price,
                        is_active = true,
                        updated_at = EXCLUDED.updated_at
                    """, parameters);
            syncCount(cartId);
            return findItem(cartId, productId);
        });
    }

    @Override
    public List<CartItemView> update(String userId, List<CartUpdateItem> items) {
        return transactionTemplate.execute(status -> {
            String cartId = requireCart(userId);
            Set<String> seen = new HashSet<>();
            for (CartUpdateItem item : items) {
                if (!seen.add(item.productId())) {
                    throw new ApplicationException(
                            HttpStatus.BAD_REQUEST,
                            "DUPLICATE_CART_ITEM",
                            "A cart item may appear only once per update."
                    );
                }
                requireOwnedItem(cartId, item.productId());
                if (item.quantity() == 0) {
                    jdbcTemplate.update("""
                            DELETE FROM cart_products
                             WHERE "cart_product_cartId" = :cartId
                               AND "cart_product_productId" = :productId
                            """, itemParameters(cartId, item.productId()));
                } else {
                    ServerProduct product = requireProduct(item.productId());
                    jdbcTemplate.update("""
                            UPDATE cart_products
                               SET "cart_product_shopId" = :shopId,
                                   cart_product_quantity = :quantity,
                                   cart_product_name = :name,
                                   cart_product_price = :price,
                                   updated_at = :now
                             WHERE "cart_product_cartId" = :cartId
                               AND "cart_product_productId" = :productId
                               AND is_active = true
                            """, itemParameters(cartId, item.productId())
                            .addValue("shopId", product.shopId())
                            .addValue("quantity", item.quantity())
                            .addValue("name", product.name())
                            .addValue("price", product.price())
                            .addValue("now", clock.millis()));
                }
            }
            syncCount(cartId);
            return listByCart(cartId);
        });
    }

    @Override
    public int delete(String userId, String productId) {
        return transactionTemplate.execute(status -> {
            String cartId = requireCart(userId);
            requireOwnedItem(cartId, productId);
            jdbcTemplate.update("""
                    DELETE FROM cart_products
                     WHERE "cart_product_cartId" = :cartId
                       AND "cart_product_productId" = :productId
                    """, itemParameters(cartId, productId));
            return syncCount(cartId);
        });
    }

    @Override
    public List<CartItemView> list(String userId) {
        List<String> carts = jdbcTemplate.query("""
                SELECT id FROM carts
                 WHERE "cart_userId" = :userId AND is_active = true
                """, new MapSqlParameterSource("userId", userId),
                (resultSet, rowNumber) -> resultSet.getString(1));
        return carts.isEmpty() ? List.of() : listByCart(carts.getFirst());
    }

    private ServerProduct requireProduct(String productId) {
        List<ServerProduct> products = jdbcTemplate.query("""
                SELECT sku.id, COALESCE(NULLIF(sku.name, ''), product.name) AS name,
                       sku.price, product."shopBusinessId" AS shop_id
                  FROM "Sku" sku
                  JOIN "Spu" product ON product.id = sku."spuId"
                 WHERE sku.id = :productId
                   AND sku.status = 1
                   AND sku.is_active = true
                   AND product.status = 1
                   AND product."isMarketable" = true
                   AND product.is_active = true
                """, new MapSqlParameterSource("productId", productId),
                (resultSet, rowNumber) -> new ServerProduct(
                        resultSet.getString("id"),
                        resultSet.getString("shop_id"),
                        resultSet.getString("name"),
                        resultSet.getLong("price")
                ));
        if (products.isEmpty()) {
            throw new ApplicationException(HttpStatus.NOT_FOUND, "PRODUCT_UNAVAILABLE", "Product is unavailable.");
        }
        return products.getFirst();
    }

    private String getOrCreateCart(String userId) {
        long now = clock.millis();
        jdbcTemplate.update("""
                INSERT INTO carts(
                    id, cart_state, cart_count_product, "cart_userId",
                    is_active, created_at, updated_at
                ) VALUES (
                    :id, 'ACTIVE'::"CartState", 0, :userId, true, :now, :now
                ) ON CONFLICT ("cart_userId") DO NOTHING
                """, new MapSqlParameterSource()
                .addValue("id", UUID.randomUUID().toString())
                .addValue("userId", userId)
                .addValue("now", now));
        return requireCart(userId);
    }

    private String requireCart(String userId) {
        List<String> ids = jdbcTemplate.query("""
                SELECT id FROM carts
                 WHERE "cart_userId" = :userId AND is_active = true
                 FOR UPDATE
                """, new MapSqlParameterSource("userId", userId),
                (resultSet, rowNumber) -> resultSet.getString(1));
        if (ids.isEmpty()) {
            throw new ApplicationException(HttpStatus.NOT_FOUND, "CART_NOT_FOUND", "Cart not found.");
        }
        return ids.getFirst();
    }

    private void requireOwnedItem(String cartId, String productId) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT count(*) FROM cart_products
                 WHERE "cart_product_cartId" = :cartId
                   AND "cart_product_productId" = :productId
                   AND is_active = true
                """, itemParameters(cartId, productId), Integer.class);
        if (count == null || count != 1) {
            throw new ApplicationException(HttpStatus.NOT_FOUND, "CART_ITEM_NOT_FOUND", "Cart item not found.");
        }
    }

    private CartItemView findItem(String cartId, String productId) {
        return jdbcTemplate.query("""
                SELECT id, "cart_product_productId" AS product_id,
                       "cart_product_shopId" AS shop_id, cart_product_quantity AS quantity,
                       cart_product_name AS name, cart_product_price AS price
                  FROM cart_products
                 WHERE "cart_product_cartId" = :cartId
                   AND "cart_product_productId" = :productId
                   AND is_active = true
                """, itemParameters(cartId, productId), this::mapItem).getFirst();
    }

    private List<CartItemView> listByCart(String cartId) {
        return jdbcTemplate.query("""
                SELECT id, "cart_product_productId" AS product_id,
                       "cart_product_shopId" AS shop_id, cart_product_quantity AS quantity,
                       cart_product_name AS name, cart_product_price AS price
                  FROM cart_products
                 WHERE "cart_product_cartId" = :cartId AND is_active = true
                 ORDER BY created_at DESC, id
                """, new MapSqlParameterSource("cartId", cartId), this::mapItem);
    }

    private CartItemView mapItem(java.sql.ResultSet resultSet, int rowNumber) throws java.sql.SQLException {
        return new CartItemView(
                resultSet.getString("id"), resultSet.getString("product_id"),
                resultSet.getString("shop_id"), resultSet.getInt("quantity"),
                resultSet.getString("name"), resultSet.getBigDecimal("price").longValueExact()
        );
    }

    private int syncCount(String cartId) {
        jdbcTemplate.update("""
                UPDATE carts
                   SET cart_count_product = (
                       SELECT count(*) FROM cart_products
                        WHERE "cart_product_cartId" = :cartId AND is_active = true
                   ), updated_at = :now
                 WHERE id = :cartId
                """, new MapSqlParameterSource().addValue("cartId", cartId).addValue("now", clock.millis()));
        return jdbcTemplate.queryForObject(
                "SELECT cart_count_product FROM carts WHERE id = :cartId",
                new MapSqlParameterSource("cartId", cartId), Integer.class
        );
    }

    private MapSqlParameterSource itemParameters(String cartId, String productId) {
        return new MapSqlParameterSource().addValue("cartId", cartId).addValue("productId", productId);
    }

    private record ServerProduct(String id, String shopId, String name, long price) {
    }
}
