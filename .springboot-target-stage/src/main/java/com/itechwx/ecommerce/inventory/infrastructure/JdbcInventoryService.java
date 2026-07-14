package com.itechwx.ecommerce.inventory.infrastructure;

import com.itechwx.ecommerce.inventory.application.InventoryService;
import com.itechwx.ecommerce.inventory.application.InventoryView;
import com.itechwx.ecommerce.shared.error.ApplicationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;
import java.util.List;
import java.util.UUID;

public final class JdbcInventoryService implements InventoryService {

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final TransactionTemplate transactionTemplate;
    private final Clock clock;

    public JdbcInventoryService(
            NamedParameterJdbcTemplate jdbcTemplate,
            TransactionTemplate transactionTemplate,
            Clock clock
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.transactionTemplate = transactionTemplate;
        this.clock = clock;
    }

    @Override
    public InventoryView addStock(String shopId, String productId, int stock, String location) {
        return transactionTemplate.execute(status -> {
            Integer owned = jdbcTemplate.queryForObject("""
                    SELECT count(*)
                      FROM "Sku" sku
                      JOIN "Spu" product ON product.id = sku."spuId"
                     WHERE sku.id = :productId
                       AND sku.is_active = true
                       AND product.is_active = true
                       AND product."shopBusinessId" = :shopId
                    """, new MapSqlParameterSource()
                    .addValue("productId", productId)
                    .addValue("shopId", shopId), Integer.class);
            if (owned == null || owned != 1) {
                throw new ApplicationException(
                        HttpStatus.BAD_REQUEST,
                        "PRODUCT_NOT_OWNED",
                        "Product not found for this shop."
                );
            }
            MapSqlParameterSource parameters = new MapSqlParameterSource()
                    .addValue("id", UUID.randomUUID().toString())
                    .addValue("productId", productId)
                    .addValue("shopId", shopId)
                    .addValue("stock", stock)
                    .addValue("location", location == null || location.isBlank() ? "unknown" : location.trim())
                    .addValue("now", clock.millis());
            int updated = jdbcTemplate.update("""
                    INSERT INTO inventories(
                        id, inventory_product_id, inventory_location, inventory_stock,
                        is_active, created_at, updated_at, "shopBusinessId"
                    ) VALUES (
                        :id, :productId, :location, :stock, true, :now, :now, :shopId
                    )
                    ON CONFLICT (inventory_product_id) DO UPDATE SET
                        inventory_stock = inventories.inventory_stock + EXCLUDED.inventory_stock,
                        inventory_location = EXCLUDED.inventory_location,
                        updated_at = EXCLUDED.updated_at
                    WHERE inventories."shopBusinessId" = :shopId
                    """, parameters);
            if (updated != 1) {
                throw new ApplicationException(
                        HttpStatus.CONFLICT,
                        "INVENTORY_OWNERSHIP_CONFLICT",
                        "Inventory belongs to another shop."
                );
            }
            return find(productId, shopId);
        });
    }

    private InventoryView find(String productId, String shopId) {
        List<InventoryView> rows = jdbcTemplate.query("""
                SELECT id, inventory_product_id, "shopBusinessId", inventory_location, inventory_stock
                  FROM inventories
                 WHERE inventory_product_id = :productId
                   AND "shopBusinessId" = :shopId
                   AND is_active = true
                """, new MapSqlParameterSource()
                .addValue("productId", productId)
                .addValue("shopId", shopId), (resultSet, rowNumber) -> new InventoryView(
                resultSet.getString("id"),
                resultSet.getString("inventory_product_id"),
                resultSet.getString("shopBusinessId"),
                resultSet.getString("inventory_location"),
                resultSet.getInt("inventory_stock")
        ));
        if (rows.isEmpty()) {
            throw new ApplicationException(HttpStatus.NOT_FOUND, "INVENTORY_NOT_FOUND", "Inventory not found.");
        }
        return rows.getFirst();
    }
}
