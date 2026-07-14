package com.itechwx.ecommerce.catalog.infrastructure;

import com.itechwx.ecommerce.catalog.application.BrandView;
import com.itechwx.ecommerce.catalog.application.CatalogService;
import com.itechwx.ecommerce.catalog.application.CategoryView;
import com.itechwx.ecommerce.catalog.application.CreateSkuCommand;
import com.itechwx.ecommerce.catalog.application.CreateSpuCommand;
import com.itechwx.ecommerce.catalog.application.ProductMutationResponse;
import com.itechwx.ecommerce.catalog.application.ProductView;
import com.itechwx.ecommerce.catalog.application.SkuView;
import com.itechwx.ecommerce.catalog.application.UpdateProductCommand;
import com.itechwx.ecommerce.eventing.application.DomainEventOutbox;
import com.itechwx.ecommerce.shared.error.ApplicationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.support.SqlArrayValue;
import org.springframework.transaction.support.TransactionTemplate;

import java.sql.Array;
import java.sql.SQLException;
import java.time.Clock;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class JdbcCatalogService implements CatalogService {

    private static final String PRODUCT_SELECT = """
            SELECT product.id,
                   product.name,
                   product.intro,
                   product."brandId" AS brand_id,
                   product."categoryId" AS category_id,
                   product.images,
                   product."afterSalesService" AS after_sales_service,
                   product.content,
                   product."attributeList" AS attribute_list,
                   product."isMarketable" AS is_marketable,
                   product.status,
                   product."shopBusinessId" AS shop_id,
                   product.created_at,
                   product.updated_at,
                   brand.name AS brand_name,
                   brand.image AS brand_image,
                   brand.initial AS brand_initial,
                   brand.sort AS brand_sort,
                   category.name AS category_name,
                   category.sort AS category_sort
              FROM "Spu" product
              JOIN "Brand" brand ON brand.id = product."brandId" AND brand.is_active = true
              JOIN "Category" category ON category.id = product."categoryId" AND category.is_active = true
            """;
    private static final String SKU_SELECT = """
            SELECT sku.id,
                   sku.name,
                   sku.price,
                   COALESCE(inventory.inventory_stock, sku.num) AS num,
                   sku.image,
                   sku.images,
                   sku."brandName" AS brand_name,
                   sku."skuAttribute" AS sku_attribute,
                   sku.status,
                   sku."spuId" AS spu_id
              FROM "Sku" sku
              LEFT JOIN inventories inventory
                ON inventory.inventory_product_id = sku.id AND inventory.is_active = true
             WHERE sku.is_active = true
            """;

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final TransactionTemplate transactionTemplate;
    private final Clock clock;
    private final DomainEventOutbox eventOutbox;

    public JdbcCatalogService(
            NamedParameterJdbcTemplate jdbcTemplate,
            TransactionTemplate transactionTemplate,
            Clock clock
    ) {
        this(jdbcTemplate, transactionTemplate, clock, DomainEventOutbox.disabled());
    }

    public JdbcCatalogService(
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
    public ProductMutationResponse createProduct(
            String shopId,
            CreateSpuCommand spu,
            CreateSkuCommand sku
    ) {
        requireActiveShop(shopId);
        requireCatalogReferences(spu.brandId(), spu.categoryId());
        try {
            return transactionTemplate.execute(status -> {
                MapSqlParameterSource lookup = new MapSqlParameterSource()
                        .addValue("name", spu.name().trim())
                        .addValue("brandId", spu.brandId())
                        .addValue("categoryId", spu.categoryId())
                        .addValue("shopId", shopId);
                List<String> existing = jdbcTemplate.query("""
                        SELECT id
                          FROM "Spu"
                         WHERE name = :name
                           AND "brandId" = :brandId
                           AND "categoryId" = :categoryId
                           AND "shopBusinessId" = :shopId
                           AND is_active = true
                         FOR UPDATE
                        """, lookup, (resultSet, rowNumber) -> resultSet.getString(1));
                String productId;
                if (existing.isEmpty()) {
                    productId = UUID.randomUUID().toString();
                    insertSpu(productId, shopId, spu);
                } else {
                    productId = existing.getFirst();
                }
                rejectDuplicateSku(productId, sku.attributes());
                String skuId = insertSku(productId, sku);
                eventOutbox.productCreated(productId, spu.name().trim(), shopId);
                return new ProductMutationResponse(
                        findForShopById(shopId, productId),
                        findSku(skuId)
                );
            });
        } catch (DataIntegrityViolationException exception) {
            throw conflict(
                    "PRODUCT_CONFLICT",
                    "The product or SKU conflicts with an existing catalog record."
            );
        }
    }

    @Override
    public BrandView createBrand(
            String shopId,
            String name,
            String image,
            String initial,
            Integer sort
    ) {
        requireActiveShop(shopId);
        String id = UUID.randomUUID().toString();
        MapSqlParameterSource parameters = new MapSqlParameterSource()
                .addValue("id", id)
                .addValue("name", name.trim())
                .addValue("image", defaultValue(image, ""))
                .addValue("initial", defaultValue(initial, ""))
                .addValue("sort", sort == null ? 10 : sort)
                .addValue("now", clock.millis());
        try {
            jdbcTemplate.update("""
                    INSERT INTO "Brand"(
                        id, name, image, initial, sort, is_active, created_at, updated_at
                    ) VALUES (
                        :id, :name, :image, :initial, :sort, true, :now, :now
                    )
                    """, parameters);
        } catch (DataIntegrityViolationException exception) {
            throw conflict("BRAND_EXISTS", "A brand with that name already exists.");
        }
        return new BrandView(
                id,
                parameters.getValue("name").toString(),
                parameters.getValue("image").toString(),
                parameters.getValue("initial").toString(),
                (Integer) parameters.getValue("sort")
        );
    }

    @Override
    public ProductMutationResponse updateProduct(
            String shopId,
            String productId,
            UpdateProductCommand command
    ) {
        try {
            return transactionTemplate.execute(status -> {
                ProductView current = findForShopById(shopId, productId);
                if (command.brandId() != null || command.categoryId() != null) {
                    requireCatalogReferences(
                            command.brandId() == null ? current.brandId() : command.brandId(),
                            command.categoryId() == null ? current.categoryId() : command.categoryId()
                    );
                }
                updateSpu(productId, command);
                String skuId = firstSkuId(productId);
                if (skuId != null) {
                    updateSku(skuId, command);
                }
                ProductView updated = findForShopById(shopId, productId);
                return new ProductMutationResponse(
                        updated,
                        skuId == null ? null : findSku(skuId)
                );
            });
        } catch (DataIntegrityViolationException exception) {
            throw conflict("PRODUCT_CONFLICT", "The update conflicts with an existing catalog record.");
        }
    }

    @Override
    public ProductView publish(String shopId, String productId, boolean published) {
        int updated = jdbcTemplate.update("""
                UPDATE "Spu"
                   SET status = :status,
                       "isMarketable" = :published,
                       updated_at = :now
                 WHERE id = :productId
                   AND "shopBusinessId" = :shopId
                   AND is_active = true
                """, new MapSqlParameterSource()
                .addValue("status", published ? 1 : 0)
                .addValue("published", published)
                .addValue("now", clock.millis())
                .addValue("productId", productId)
                .addValue("shopId", shopId));
        if (updated != 1) {
            throw productNotFound();
        }
        return findForShopById(shopId, productId);
    }

    @Override
    public List<ProductView> listForShop(String shopId, boolean published, int skip, int take) {
        return queryProducts(
                PRODUCT_SELECT + """
                         WHERE product."shopBusinessId" = :shopId
                           AND product.status = :status
                           AND product.is_active = true
                           AND (:published = false OR product."isMarketable" = true)
                         ORDER BY product.created_at DESC, product.id
                         LIMIT :take OFFSET :skip
                        """,
                new MapSqlParameterSource()
                        .addValue("shopId", shopId)
                        .addValue("status", published ? 1 : 0)
                        .addValue("published", published)
                        .addValue("take", take)
                        .addValue("skip", skip)
        );
    }

    @Override
    public List<ProductView> listPublic(int skip, int take) {
        return queryProducts(
                PRODUCT_SELECT + """
                         WHERE product.status = 1
                           AND product."isMarketable" = true
                           AND product.is_active = true
                         ORDER BY product.created_at DESC, product.id
                         LIMIT :take OFFSET :skip
                        """,
                new MapSqlParameterSource().addValue("take", take).addValue("skip", skip)
        );
    }

    @Override
    public List<ProductView> searchPublic(String keyword, int take) {
        return queryProducts(
                PRODUCT_SELECT + """
                         WHERE product.status = 1
                           AND product."isMarketable" = true
                           AND product.is_active = true
                           AND (product.name = :keyword
                                OR product.intro = :keyword
                                OR product.content = :keyword)
                         ORDER BY product.created_at DESC, product.id
                         LIMIT :take
                        """,
                new MapSqlParameterSource().addValue("keyword", keyword).addValue("take", take)
        );
    }

    @Override
    public ProductView findPublicById(String productId) {
        List<ProductView> products = queryProducts(
                PRODUCT_SELECT + """
                         WHERE product.id = :productId
                           AND product.status = 1
                           AND product."isMarketable" = true
                           AND product.is_active = true
                        """,
                new MapSqlParameterSource("productId", productId)
        );
        if (products.isEmpty()) {
            throw productNotFound();
        }
        return products.getFirst();
    }

    @Override
    public List<ProductView> findPublicByName(String keyword, int take) {
        return queryProducts(
                PRODUCT_SELECT + """
                         WHERE product.status = 1
                           AND product."isMarketable" = true
                           AND product.is_active = true
                           AND (product.name = :keyword OR product.intro = :keyword)
                         ORDER BY product.created_at DESC, product.id
                         LIMIT :take
                        """,
                new MapSqlParameterSource().addValue("keyword", keyword).addValue("take", take)
        );
    }

    private void requireActiveShop(String shopId) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT count(*)
                  FROM shop_business shop
                  JOIN accounts account ON account.id = shop."accountId"
                 WHERE shop."accountId" = :shopId
                   AND account.account_type = 'SHOP'::"AccountType"
                   AND account.status = 'ACTIVE'::"Status"
                   AND account.is_active = true
                """, new MapSqlParameterSource("shopId", shopId), Integer.class);
        if (count == null || count != 1) {
            throw new ApplicationException(
                    HttpStatus.FORBIDDEN,
                    "SHOP_NOT_ACTIVE",
                    "An active shop account is required."
            );
        }
    }

    private void requireCatalogReferences(String brandId, String categoryId) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT count(*)
                  FROM "Brand" brand
                  JOIN "Category" category ON category.id = :categoryId AND category.is_active = true
                 WHERE brand.id = :brandId
                   AND brand.is_active = true
                """, new MapSqlParameterSource()
                .addValue("brandId", brandId)
                .addValue("categoryId", categoryId), Integer.class);
        if (count == null || count != 1) {
            throw new ApplicationException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_CATALOG_REFERENCE",
                    "The selected brand or category is unavailable."
            );
        }
    }

    private void insertSpu(String productId, String shopId, CreateSpuCommand command) {
        jdbcTemplate.update("""
                INSERT INTO "Spu"(
                    id, name, intro, "brandId", "categoryId", images,
                    "afterSalesService", content, "attributeList", "isMarketable",
                    status, "shopBusinessId", is_active, created_at, updated_at
                ) VALUES (
                    :id, :name, :intro, :brandId, :categoryId, :images,
                    :afterSalesService, :content, :attributeList, :isMarketable,
                    :status, :shopId, true, :now, :now
                )
                """, new MapSqlParameterSource()
                .addValue("id", productId)
                .addValue("name", command.name().trim())
                .addValue("intro", normalize(command.intro()))
                .addValue("brandId", command.brandId())
                .addValue("categoryId", command.categoryId())
                .addValue("images", sqlArray(command.images()))
                .addValue("afterSalesService", normalize(command.afterSalesService()))
                .addValue("content", normalize(command.content()))
                .addValue("attributeList", normalize(command.attributeList()))
                .addValue("isMarketable", Boolean.TRUE.equals(command.isMarketable()))
                .addValue("status", command.status() == null ? 0 : command.status())
                .addValue("shopId", shopId)
                .addValue("now", clock.millis()));
    }

    private String insertSku(String productId, CreateSkuCommand command) {
        String skuId = UUID.randomUUID().toString();
        jdbcTemplate.update("""
                INSERT INTO "Sku"(
                    id, name, price, num, image, images, "spuId", "brandName",
                    "skuAttribute", status, is_active, created_at, updated_at
                ) VALUES (
                    :id, :name, :price, :stock, :image, :images, :productId, :brandName,
                    :attributes, :status, true, :now, :now
                )
                """, new MapSqlParameterSource()
                .addValue("id", skuId)
                .addValue("name", command.name().trim())
                .addValue("price", command.price())
                .addValue("stock", command.stock() == null ? 100 : command.stock())
                .addValue("image", normalize(command.image()))
                .addValue("images", sqlArray(command.images()))
                .addValue("productId", productId)
                .addValue("brandName", normalize(command.brandName()))
                .addValue("attributes", normalize(command.attributes()))
                .addValue("status", command.status() == null ? 1 : command.status())
                .addValue("now", clock.millis()));
        return skuId;
    }

    private void rejectDuplicateSku(String productId, String attributes) {
        MapSqlParameterSource parameters = new MapSqlParameterSource()
                .addValue("productId", productId)
                .addValue("attributes", normalize(attributes));
        Integer count = jdbcTemplate.queryForObject("""
                SELECT count(*)
                  FROM "Sku"
                 WHERE "spuId" = :productId
                   AND is_active = true
                   AND (:attributes IS NULL OR "skuAttribute" = :attributes)
                """, parameters, Integer.class);
        if (count != null && count > 0) {
            throw conflict("SKU_EXISTS", "That SKU variant already exists for this product.");
        }
    }

    private void updateSpu(String productId, UpdateProductCommand command) {
        List<String> assignments = new ArrayList<>();
        MapSqlParameterSource parameters = new MapSqlParameterSource()
                .addValue("productId", productId)
                .addValue("now", clock.millis());
        add(assignments, parameters, "name", "name", command.name());
        add(assignments, parameters, "intro", "intro", command.intro());
        add(assignments, parameters, "\"brandId\"", "brandId", command.brandId());
        add(assignments, parameters, "\"categoryId\"", "categoryId", command.categoryId());
        if (command.images() != null) {
            assignments.add("images = :spuImages");
            parameters.addValue("spuImages", sqlArray(command.images()));
        }
        add(assignments, parameters, "\"afterSalesService\"", "afterSalesService", command.afterSalesService());
        add(assignments, parameters, "content", "content", command.content());
        add(assignments, parameters, "\"attributeList\"", "attributeList", command.attributeList());
        if (assignments.isEmpty()) {
            return;
        }
        assignments.add("updated_at = :now");
        jdbcTemplate.update(
                "UPDATE \"Spu\" SET " + String.join(", ", assignments) + " WHERE id = :productId",
                parameters
        );
    }

    private void updateSku(String skuId, UpdateProductCommand command) {
        List<String> assignments = new ArrayList<>();
        MapSqlParameterSource parameters = new MapSqlParameterSource()
                .addValue("skuId", skuId)
                .addValue("now", clock.millis());
        add(assignments, parameters, "name", "skuName", command.name());
        add(assignments, parameters, "price", "price", command.price());
        add(assignments, parameters, "num", "stock", command.stock());
        add(assignments, parameters, "image", "image", command.image());
        if (command.images() != null) {
            assignments.add("images = :skuImages");
            parameters.addValue("skuImages", sqlArray(command.images()));
        }
        add(assignments, parameters, "\"brandName\"", "brandName", command.brandName());
        add(assignments, parameters, "\"skuAttribute\"", "attributes", command.attributes());
        if (assignments.isEmpty()) {
            return;
        }
        assignments.add("updated_at = :now");
        jdbcTemplate.update(
                "UPDATE \"Sku\" SET " + String.join(", ", assignments) + " WHERE id = :skuId",
                parameters
        );
    }

    private void add(
            List<String> assignments,
            MapSqlParameterSource parameters,
            String column,
            String parameter,
            Object value
    ) {
        if (value != null) {
            assignments.add(column + " = :" + parameter);
            parameters.addValue(parameter, value instanceof String string ? string.trim() : value);
        }
    }

    private ProductView findForShopById(String shopId, String productId) {
        List<ProductView> products = queryProducts(
                PRODUCT_SELECT + """
                         WHERE product.id = :productId
                           AND product."shopBusinessId" = :shopId
                           AND product.is_active = true
                        """,
                new MapSqlParameterSource().addValue("productId", productId).addValue("shopId", shopId)
        );
        if (products.isEmpty()) {
            throw productNotFound();
        }
        return products.getFirst();
    }

    private String firstSkuId(String productId) {
        List<String> ids = jdbcTemplate.query("""
                SELECT id
                  FROM "Sku"
                 WHERE "spuId" = :productId
                   AND is_active = true
                 ORDER BY created_at, id
                 LIMIT 1
                """, new MapSqlParameterSource("productId", productId),
                (resultSet, rowNumber) -> resultSet.getString(1));
        return ids.isEmpty() ? null : ids.getFirst();
    }

    private SkuView findSku(String skuId) {
        List<SkuView> skus = jdbcTemplate.query(
                SKU_SELECT + " AND sku.id = :skuId",
                new MapSqlParameterSource("skuId", skuId),
                (resultSet, rowNumber) -> mapSku(resultSet)
        );
        if (skus.isEmpty()) {
            throw productNotFound();
        }
        return skus.getFirst();
    }

    private List<ProductView> queryProducts(String sql, MapSqlParameterSource parameters) {
        List<ProductRow> products = jdbcTemplate.query(sql, parameters, (resultSet, rowNumber) ->
                new ProductRow(
                        resultSet.getString("id"),
                        resultSet.getString("name"),
                        resultSet.getString("intro"),
                        resultSet.getString("brand_id"),
                        resultSet.getString("category_id"),
                        stringList(resultSet.getArray("images")),
                        resultSet.getString("after_sales_service"),
                        resultSet.getString("content"),
                        resultSet.getString("attribute_list"),
                        resultSet.getBoolean("is_marketable"),
                        resultSet.getInt("status"),
                        resultSet.getString("shop_id"),
                        resultSet.getLong("created_at"),
                        resultSet.getLong("updated_at"),
                        new BrandView(
                                resultSet.getString("brand_id"),
                                resultSet.getString("brand_name"),
                                resultSet.getString("brand_image"),
                                resultSet.getString("brand_initial"),
                                (Integer) resultSet.getObject("brand_sort")
                        ),
                        new CategoryView(
                                resultSet.getString("category_id"),
                                resultSet.getString("category_name"),
                                (Integer) resultSet.getObject("category_sort")
                        )
                ));
        if (products.isEmpty()) {
            return List.of();
        }
        List<String> productIds = products.stream().map(ProductRow::id).toList();
        Map<String, List<SkuView>> skus = new LinkedHashMap<>();
        jdbcTemplate.query(
                SKU_SELECT + " AND sku.\"spuId\" IN (:productIds) ORDER BY sku.created_at, sku.id",
                new MapSqlParameterSource("productIds", productIds),
                resultSet -> {
                    skus.computeIfAbsent(resultSet.getString("spu_id"), ignored -> new ArrayList<>())
                            .add(mapSku(resultSet));
                }
        );
        return products.stream().map(product -> product.toView(
                List.copyOf(skus.getOrDefault(product.id(), Collections.emptyList()))
        )).toList();
    }

    private SkuView mapSku(java.sql.ResultSet resultSet) throws SQLException {
        return new SkuView(
                resultSet.getString("id"),
                resultSet.getString("name"),
                resultSet.getInt("price"),
                (Integer) resultSet.getObject("num"),
                resultSet.getString("image"),
                stringList(resultSet.getArray("images")),
                resultSet.getString("brand_name"),
                resultSet.getString("sku_attribute"),
                (Integer) resultSet.getObject("status")
        );
    }

    private List<String> stringList(Array array) throws SQLException {
        if (array == null) {
            return List.of();
        }
        try {
            return List.copyOf(Arrays.asList((String[]) array.getArray()));
        } finally {
            array.free();
        }
    }

    private SqlArrayValue sqlArray(List<String> values) {
        List<String> safeValues = values == null ? List.of() : values;
        return new SqlArrayValue("varchar", (Object[]) safeValues.toArray(String[]::new));
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String defaultValue(String value, String fallback) {
        String normalized = normalize(value);
        return normalized == null ? fallback : normalized;
    }

    private ApplicationException productNotFound() {
        return new ApplicationException(HttpStatus.NOT_FOUND, "PRODUCT_NOT_FOUND", "Product not found.");
    }

    private ApplicationException conflict(String code, String message) {
        return new ApplicationException(HttpStatus.CONFLICT, code, message);
    }

    private record ProductRow(
            String id,
            String name,
            String intro,
            String brandId,
            String categoryId,
            List<String> images,
            String afterSalesService,
            String content,
            String attributeList,
            boolean isMarketable,
            int status,
            String shopBusinessId,
            long createdAt,
            long updatedAt,
            BrandView brand,
            CategoryView category
    ) {
        ProductView toView(List<SkuView> skus) {
            return new ProductView(
                    id,
                    name,
                    intro,
                    brandId,
                    categoryId,
                    images,
                    afterSalesService,
                    content,
                    attributeList,
                    isMarketable,
                    status,
                    shopBusinessId,
                    createdAt,
                    updatedAt,
                    brand,
                    category,
                    skus
            );
        }
    }
}
