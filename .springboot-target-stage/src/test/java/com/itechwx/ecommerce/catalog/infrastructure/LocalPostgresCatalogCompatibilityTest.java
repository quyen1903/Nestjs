package com.itechwx.ecommerce.catalog.infrastructure;

import com.itechwx.ecommerce.catalog.application.CreateSkuCommand;
import com.itechwx.ecommerce.catalog.application.CreateSpuCommand;
import com.itechwx.ecommerce.catalog.application.UpdateProductCommand;
import com.itechwx.ecommerce.shared.error.ApplicationException;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import javax.sql.DataSource;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@EnabledIfEnvironmentVariable(named = "MIGRATION_TEST_DB_URL", matches = ".+")
class LocalPostgresCatalogCompatibilityTest {

    @Test
    void provesShopIsolationPublishedOnlyProjectionAndExactLegacyColumns() {
        DataSource dataSource = org.springframework.boot.jdbc.DataSourceBuilder.create()
                .url(System.getenv("MIGRATION_TEST_DB_URL"))
                .username(System.getenv("MIGRATION_TEST_DB_USERNAME"))
                .password(System.getenv("MIGRATION_TEST_DB_PASSWORD"))
                .build();
        Flyway.configure().dataSource(dataSource)
                .locations("classpath:db/migration").load().migrate();

        JdbcTemplate jdbc = new JdbcTemplate(dataSource);
        NamedParameterJdbcTemplate namedJdbc = new NamedParameterJdbcTemplate(dataSource);
        TransactionTemplate transactions = new TransactionTemplate(new DataSourceTransactionManager(dataSource));
        Clock clock = Clock.fixed(Instant.parse("2026-06-29T12:00:00Z"), ZoneOffset.UTC);
        JdbcCatalogService catalog = new JdbcCatalogService(namedJdbc, transactions, clock);
        JdbcCategoryService categories = new JdbcCategoryService(namedJdbc, transactions, clock);

        insertShop(jdbc, "catalog-shop-one", "catalog-one@example.test");
        insertShop(jdbc, "catalog-shop-two", "catalog-two@example.test");
        var parent = categories.create("Electronics Fixture", 1, null);
        var child = categories.create("Phones Fixture", 2, parent.id());
        assertThat(jdbc.queryForObject("""
                SELECT count(*) FROM "CategoryClosureTable"
                 WHERE "ancestorId" = ? AND "descendantId" = ? AND depth = 1 AND is_active = true
                """, Integer.class, parent.id(), child.id())).isEqualTo(1);

        var brand = catalog.createBrand(
                "catalog-shop-one", "Catalog Fixture Brand", "", "C", 1
        );
        CreateSpuCommand spu = new CreateSpuCommand(
                "Catalog Fixture Phone",
                "Fixture phone",
                brand.id(),
                child.id(),
                List.of("https://example.test/phone.png"),
                "One year fixture warranty",
                "Public fixture content",
                "fixture-attributes",
                false,
                0
        );
        CreateSkuCommand redSku = new CreateSkuCommand(
                "Catalog Fixture Phone Red",
                129900,
                10,
                null,
                List.of("https://example.test/red.png"),
                brand.name(),
                "red",
                1
        );
        var created = catalog.createProduct("catalog-shop-one", spu, redSku);
        assertThat(created.spu().shopBusinessId()).isEqualTo("catalog-shop-one");
        assertThat(catalog.listPublic(0, 50)).isEmpty();
        assertThat(catalog.listForShop("catalog-shop-one", false, 0, 10))
                .extracting(product -> product.id())
                .containsExactly(created.spu().id());

        assertThatThrownBy(() -> catalog.publish(
                "catalog-shop-two", created.spu().id(), true
        )).isInstanceOf(ApplicationException.class)
                .extracting(exception -> ((ApplicationException) exception).code())
                .isEqualTo("PRODUCT_NOT_FOUND");

        catalog.publish("catalog-shop-one", created.spu().id(), true);
        assertThat(catalog.listPublic(0, 50))
                .extracting(product -> product.id())
                .containsExactly(created.spu().id());
        assertThat(catalog.findPublicById(created.spu().id()).skus().getFirst().stock()).isEqualTo(10);

        CreateSkuCommand blueSku = new CreateSkuCommand(
                "Catalog Fixture Phone Blue", 139900, 5, null, List.of(), brand.name(), "blue", 1
        );
        var secondVariant = catalog.createProduct("catalog-shop-one", spu, blueSku);
        assertThat(secondVariant.spu().skus()).hasSize(2);
        assertThatThrownBy(() -> catalog.createProduct("catalog-shop-one", spu, redSku))
                .isInstanceOf(ApplicationException.class)
                .extracting(exception -> ((ApplicationException) exception).code())
                .isEqualTo("SKU_EXISTS");

        var updated = catalog.updateProduct(
                "catalog-shop-one",
                created.spu().id(),
                new UpdateProductCommand(
                        "Catalog Fixture Phone Updated",
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        149900,
                        7,
                        null,
                        null,
                        "red-updated"
                )
        );
        assertThat(jdbc.queryForObject(
                "SELECT num FROM \"Sku\" WHERE id = ?", Integer.class, updated.sku().id()
        )).isEqualTo(7);
        assertThat(jdbc.queryForObject(
                "SELECT \"skuAttribute\" FROM \"Sku\" WHERE id = ?", String.class, updated.sku().id()
        )).isEqualTo("red-updated");

        assertThatThrownBy(() -> categories.remove(child.id()))
                .isInstanceOf(ApplicationException.class)
                .extracting(exception -> ((ApplicationException) exception).code())
                .isEqualTo("CATEGORY_IN_USE");
    }

    private void insertShop(JdbcTemplate jdbc, String accountId, String email) {
        jdbc.update("""
                INSERT INTO accounts(id, account_type, status, is_active, created_at, updated_at)
                VALUES (?, 'SHOP'::"AccountType", 'ACTIVE'::"Status", true, 0, 0)
                """, accountId);
        jdbc.update("""
                INSERT INTO account_authentication(
                    "accountId", email, auth_method, is_active, created_at, updated_at
                ) VALUES (?, ?, 'EMAIL_PASSWORD'::"AuthMethod", true, 0, 0)
                """, accountId, email);
        jdbc.update("""
                INSERT INTO account_security(
                    "accountId", roles, permissions, backup_codes, created_at, updated_at
                ) VALUES (?, ARRAY['SHOP'], ARRAY['product:manage'], ARRAY[]::text[], 0, 0)
                """, accountId);
        jdbc.update("""
                INSERT INTO shop_business(
                    "accountId", business_name, business_type, created_at, updated_at
                ) VALUES (?, ?, 'retail', 0, 0)
                """, accountId, accountId + " business");
    }
}
