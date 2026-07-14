package com.itechwx.ecommerce.inventory.infrastructure;

import com.itechwx.ecommerce.cart.application.CartUpdateItem;
import com.itechwx.ecommerce.cart.infrastructure.JdbcCartService;
import com.itechwx.ecommerce.discount.application.CreateDiscountCommand;
import com.itechwx.ecommerce.discount.infrastructure.JdbcDiscountService;
import com.itechwx.ecommerce.inventory.application.ReservationRequest;
import com.itechwx.ecommerce.shared.error.ApplicationException;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@EnabledIfEnvironmentVariable(named = "MIGRATION_TEST_DB_URL", matches = ".+")
class LocalPostgresCommerceStateTest {

    private static final Instant NOW = Instant.parse("2026-07-02T04:00:00Z");

    @Test
    void provesCartPricingDiscountLimitsAndReservationConcurrency() throws Exception {
        DataSource dataSource = org.springframework.boot.jdbc.DataSourceBuilder.create()
                .url(System.getenv("MIGRATION_TEST_DB_URL"))
                .username(System.getenv("MIGRATION_TEST_DB_USERNAME"))
                .password(System.getenv("MIGRATION_TEST_DB_PASSWORD"))
                .build();
        Flyway.configure().dataSource(dataSource).locations("classpath:db/migration").load().migrate();
        JdbcTemplate jdbc = new JdbcTemplate(dataSource);
        NamedParameterJdbcTemplate named = new NamedParameterJdbcTemplate(dataSource);
        TransactionTemplate transactions = new TransactionTemplate(new DataSourceTransactionManager(dataSource));
        Clock clock = Clock.fixed(NOW, ZoneOffset.UTC);

        insertUser(jdbc, "phase4-user-one", "phase4-user-one@example.test");
        insertUser(jdbc, "phase4-user-two", "phase4-user-two@example.test");
        insertShopAndProduct(jdbc);

        JdbcCartService cart = new JdbcCartService(named, transactions, clock);
        assertThat(cart.add("phase4-user-one", "phase4-sku", 2).price()).isEqualTo(1_000);
        jdbc.update("UPDATE \"Sku\" SET price = 1200 WHERE id = 'phase4-sku'");
        assertThat(cart.update(
                "phase4-user-one", List.of(new CartUpdateItem("phase4-sku", 3))
        ).getFirst().price()).isEqualTo(1_200);
        assertThat(cart.add("phase4-user-two", "phase4-sku", 1).quantity()).isEqualTo(1);
        assertThat(cart.delete("phase4-user-two", "phase4-sku")).isZero();
        assertThat(cart.list("phase4-user-one")).hasSize(1);

        JdbcInventoryService inventory = new JdbcInventoryService(named, transactions, clock);
        assertThat(inventory.addStock("phase4-shop", "phase4-sku", 10, "fixture").stock()).isEqualTo(10);
        assertThatThrownBy(() -> inventory.addStock(
                "phase4-other-shop", "phase4-sku", 1, "wrong"
        )).isInstanceOf(ApplicationException.class)
                .extracting(exception -> ((ApplicationException) exception).code())
                .isEqualTo("PRODUCT_NOT_OWNED");

        JdbcDiscountService discounts = new JdbcDiscountService(named, transactions, clock);
        discounts.create("phase4-shop", new CreateDiscountCommand(
                "Phase 4 fixture", "Fixture percentage", "percentage", BigDecimal.TEN,
                "phase4-code", NOW.minusSeconds(60), NOW.plusSeconds(3600),
                1, 5, BigDecimal.ZERO, "specific", List.of("phase4-sku")
        ));
        assertThat(discounts.listEligibleProducts("phase4-shop", "PHASE4-CODE"))
                .extracting(product -> product.id()).containsExactly("phase4-spu");
        var quote = discounts.quoteCart(
                "phase4-user-one", "phase4-shop", "phase4-code", List.of("phase4-sku")
        );
        assertThat(quote.totalOrder()).isEqualByComparingTo("3600.00");
        assertThat(quote.discount()).isEqualByComparingTo("360.00");

        Callable<String> consume = () -> {
            try {
                discounts.consume(
                        "phase4-user-one", "phase4-shop", "phase4-code", List.of("phase4-sku")
                );
                return "SUCCESS";
            } catch (ApplicationException exception) {
                return exception.code();
            }
        };
        try (var executor = Executors.newFixedThreadPool(2)) {
            assertThat(executor.invokeAll(List.of(consume, consume)).stream().map(future -> {
                try {
                    return future.get();
                } catch (Exception exception) {
                    throw new AssertionError(exception);
                }
            }).toList()).containsExactlyInAnyOrder("SUCCESS", "DISCOUNT_EXHAUSTED");
        }

        JdbcInventoryReservationService reservations = new JdbcInventoryReservationService(
                named, transactions, clock
        );
        Callable<String> reserveOne = () -> reserveResult(
                reservations, "phase4-user-one", 7
        );
        Callable<String> reserveTwo = () -> reserveResult(
                reservations, "phase4-user-two", 7
        );
        List<String> results;
        try (var executor = Executors.newFixedThreadPool(2)) {
            results = executor.invokeAll(List.of(reserveOne, reserveTwo)).stream().map(future -> {
                try {
                    return future.get();
                } catch (Exception exception) {
                    throw new AssertionError(exception);
                }
            }).toList();
        }
        assertThat(results).contains("SUCCESS", "INSUFFICIENT_STOCK");
        String winner = results.getFirst().equals("SUCCESS") ? "phase4-user-one" : "phase4-user-two";
        assertThat(reservations.release(winner, "phase4-sku")).isTrue();
        assertThat(reservations.release(winner, "phase4-sku")).isFalse();
        assertThat(inventoryStock(jdbc)).isEqualTo(10);

        reservations.reserve("phase4-user-one", List.of(new ReservationRequest("phase4-sku", 4)));
        assertThat(reservations.consume("phase4-user-one", "phase4-sku")).isTrue();
        assertThat(reservations.consume("phase4-user-one", "phase4-sku")).isFalse();
        assertThat(inventoryStock(jdbc)).isEqualTo(6);

        reservations.reserve("phase4-user-two", List.of(new ReservationRequest("phase4-sku", 2)));
        JdbcInventoryReservationService later = new JdbcInventoryReservationService(
                named, transactions, Clock.offset(clock, Duration.ofMinutes(16))
        );
        assertThat(later.releaseExpired(10)).isEqualTo(1);
        assertThat(later.releaseExpired(10)).isZero();
        assertThat(inventoryStock(jdbc)).isEqualTo(6);
    }

    private String reserveResult(JdbcInventoryReservationService service, String userId, int quantity) {
        try {
            service.reserve(userId, List.of(new ReservationRequest("phase4-sku", quantity)));
            return "SUCCESS";
        } catch (ApplicationException exception) {
            return exception.code();
        }
    }

    private int inventoryStock(JdbcTemplate jdbc) {
        return jdbc.queryForObject(
                "SELECT inventory_stock FROM inventories WHERE inventory_product_id = 'phase4-sku'",
                Integer.class
        );
    }

    private void insertUser(JdbcTemplate jdbc, String id, String email) {
        jdbc.update("""
                INSERT INTO accounts(id, account_type, status, is_active, created_at, updated_at)
                VALUES (?, 'USER'::"AccountType", 'ACTIVE'::"Status", true, 0, 0)
                """, id);
        jdbc.update("""
                INSERT INTO account_authentication("accountId", email, is_active, created_at, updated_at)
                VALUES (?, ?, true, 0, 0)
                """, id, email);
        jdbc.update("""
                INSERT INTO account_security("accountId", roles, permissions, backup_codes, created_at, updated_at)
                VALUES (?, ARRAY['USER'], ARRAY['user:read'], ARRAY[]::text[], 0, 0)
                """, id);
        jdbc.update("""
                INSERT INTO user_behavior("accountId", sex, date_of_birth, created_at, updated_at)
                VALUES (?, 'FEMALE'::"Sex", TIMESTAMP '1970-01-01', 0, 0)
                """, id);
    }

    private void insertShopAndProduct(JdbcTemplate jdbc) {
        jdbc.update("""
                INSERT INTO accounts(id, account_type, status, is_active, created_at, updated_at)
                VALUES ('phase4-shop', 'SHOP'::"AccountType", 'ACTIVE'::"Status", true, 0, 0),
                       ('phase4-other-shop', 'SHOP'::"AccountType", 'ACTIVE'::"Status", true, 0, 0)
                """);
        jdbc.update("""
                INSERT INTO shop_business("accountId", business_name, business_type, created_at, updated_at)
                VALUES ('phase4-shop', 'Phase 4 Shop', 'retail', 0, 0),
                       ('phase4-other-shop', 'Other Shop', 'retail', 0, 0)
                """);
        jdbc.update("""
                INSERT INTO "Brand"(id, name, image, initial, is_active, created_at, updated_at)
                VALUES ('phase4-brand', 'Phase 4 Brand', '', 'P', true, 0, 0)
                """);
        jdbc.update("""
                INSERT INTO "Category"(id, name, is_active, created_at, updated_at)
                VALUES ('phase4-category', 'Phase 4 Category', true, 0, 0)
                """);
        jdbc.update("""
                INSERT INTO "Spu"(
                    id, name, "brandId", "categoryId", "isMarketable", status,
                    "shopBusinessId", is_active, created_at, updated_at
                ) VALUES (
                    'phase4-spu', 'Phase 4 Product', 'phase4-brand', 'phase4-category',
                    true, 1, 'phase4-shop', true, 0, 0
                )
                """);
        jdbc.update("""
                INSERT INTO "Sku"(id, name, price, num, "spuId", status, is_active, created_at, updated_at)
                VALUES ('phase4-sku', 'Phase 4 SKU', 1000, 100, 'phase4-spu', 1, true, 0, 0)
                """);
    }
}
