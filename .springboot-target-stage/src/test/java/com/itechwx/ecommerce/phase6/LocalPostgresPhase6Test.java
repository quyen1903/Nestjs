package com.itechwx.ecommerce.phase6;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.itechwx.ecommerce.comment.application.CreateCommentCommand;
import com.itechwx.ecommerce.comment.infrastructure.JdbcCommentService;
import com.itechwx.ecommerce.eventing.config.KafkaEventProperties;
import com.itechwx.ecommerce.eventing.infrastructure.JdbcDomainEventOutbox;
import com.itechwx.ecommerce.eventing.infrastructure.JdbcOutboxDispatcher;
import com.itechwx.ecommerce.inventory.infrastructure.JdbcInventoryReservationService;
import com.itechwx.ecommerce.jobs.infrastructure.JdbcOrderExpirationService;
import com.itechwx.ecommerce.notification.infrastructure.JdbcNotificationEventHandler;
import com.itechwx.ecommerce.shared.error.ApplicationException;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import javax.sql.DataSource;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Executors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@EnabledIfEnvironmentVariable(named = "MIGRATION_TEST_DB_URL", matches = ".+")
class LocalPostgresPhase6Test {

    // Keep this suite's expiry window earlier than Phase 5 fixtures so all
    // local PostgreSQL suites can share one disposable database safely.
    private static final Instant NOW = Instant.parse("2026-07-02T05:00:00Z");

    @Test
    void provesCommentEventAndSchedulerSafety() throws Exception {
        DataSource dataSource = DataSourceBuilder.create()
                .url(System.getenv("MIGRATION_TEST_DB_URL"))
                .username(System.getenv("MIGRATION_TEST_DB_USERNAME"))
                .password(System.getenv("MIGRATION_TEST_DB_PASSWORD"))
                .build();
        Flyway.configure().dataSource(dataSource).locations("classpath:db/migration").load().migrate();
        JdbcTemplate jdbc = new JdbcTemplate(dataSource);
        NamedParameterJdbcTemplate named = new NamedParameterJdbcTemplate(dataSource);
        TransactionTemplate transactions = new TransactionTemplate(new DataSourceTransactionManager(dataSource));
        Clock clock = Clock.fixed(NOW, ZoneOffset.UTC);
        ObjectMapper objectMapper = new ObjectMapper();
        insertFixtures(jdbc);

        JdbcCommentService comments = new JdbcCommentService(named, transactions, clock);
        var root = comments.create(
                "phase6-user-one",
                new CreateCommentCommand("phase6-spu", "Root comment", null)
        );
        var reply = comments.create(
                "phase6-user-two",
                new CreateCommentCommand("phase6-spu", "Reply", root.id())
        );
        assertThat(comments.find("phase6-spu", null)).extracting("id").containsExactly(root.id());
        assertThat(comments.find("phase6-spu", root.id()))
                .extracting("id", "depth").containsExactly(org.assertj.core.groups.Tuple.tuple(reply.id(), 1));
        assertThat(jdbc.queryForObject(
                "SELECT count(*) FROM comment_closure WHERE \"descendantId\" = ?",
                Integer.class, reply.id()
        )).isEqualTo(2);
        assertThatThrownBy(() -> comments.delete(
                "phase6-user-one", "phase6-spu", reply.id()
        )).isInstanceOf(ApplicationException.class)
                .extracting(exception -> ((ApplicationException) exception).code())
                .isEqualTo("COMMENT_OWNERSHIP_REQUIRED");
        assertThat(comments.delete(
                "phase6-user-two", "phase6-spu", reply.id()
        ).deletedDescendants()).isZero();
        assertThat(jdbc.queryForObject(
                "SELECT content FROM comments WHERE id = ?", String.class, root.id()
        )).isEqualTo("Root comment");

        JdbcNotificationEventHandler notifications = new JdbcNotificationEventHandler(
                named, transactions, objectMapper, clock
        );
        int eligibleRecipients = jdbc.queryForObject("""
                SELECT count(*)
                  FROM notification_threads thread
                  JOIN accounts account ON account.id = thread.noti_thread_user_id
                 WHERE thread.is_active = true
                   AND account.is_active = true
                   AND account.status = 'ACTIVE'::"Status"
                   AND account.account_type = 'USER'::"AccountType"
                """, Integer.class);
        String legacyProduct = "{\"skuId\":\"phase6-sku\",\"productName\":\"Untrusted name\"}";
        assertThat(notifications.handle(
                "legacy:product-created:0:1", "product-created", legacyProduct
        ).notificationCount()).isEqualTo(eligibleRecipients);
        assertThat(notifications.handle(
                "legacy:product-created:0:1", "product-created", legacyProduct
        ).replayed()).isTrue();
        String discount = """
                {"eventId":"phase6-event-discount","schemaVersion":1,
                 "discountId":"phase6-discount","shopId":"phase6-shop"}
                """;
        assertThat(notifications.handle(
                "phase6-event-discount", "discount-created", discount
        ).notificationCount()).isEqualTo(eligibleRecipients);
        assertThat(jdbc.queryForObject(
                """
                SELECT count(*) FROM notifications
                 WHERE noti_product_id = 'phase6-spu'
                    OR noti_discount_id = 'phase6-discount'
                """, Integer.class
        )).isEqualTo(eligibleRecipients * 2);
        assertThat(jdbc.queryForObject(
                """
                SELECT count(*) FROM notification_event_receipts
                 WHERE event_id IN ('legacy:product-created:0:1', 'phase6-event-discount')
                   AND status = 'PROCESSED'
                """,
                Integer.class
        )).isEqualTo(2);
        assertThatThrownBy(() -> notifications.handle(
                "phase6-event-wrong-scope",
                "discount-created",
                "{\"discountId\":\"phase6-discount\",\"shopId\":\"other-shop\"}"
        )).isInstanceOf(ApplicationException.class)
                .extracting(exception -> ((ApplicationException) exception).code())
                .isEqualTo("INVALID_EVENT_PAYLOAD");
        assertThat(jdbc.queryForObject(
                "SELECT count(*) FROM notification_event_receipts WHERE event_id = 'phase6-event-wrong-scope'",
                Integer.class
        )).isZero();

        KafkaEventProperties eventProperties = new KafkaEventProperties(
                true, 10, Duration.ofMinutes(5)
        );
        JdbcDomainEventOutbox outbox = new JdbcDomainEventOutbox(
                named, objectMapper, eventProperties, clock
        );
        assertThatThrownBy(() -> transactions.executeWithoutResult(status -> {
            outbox.productCreated("phase6-spu", "Phase 6 Product", "phase6-shop");
            throw new ApplicationException(
                    org.springframework.http.HttpStatus.CONFLICT,
                    "ROLLBACK_PROBE",
                    "Rollback probe."
            );
        })).isInstanceOf(ApplicationException.class);
        assertThat(jdbc.queryForObject(
                "SELECT count(*) FROM domain_event_outbox", Integer.class
        )).isZero();
        transactions.executeWithoutResult(status ->
                outbox.productCreated("phase6-spu", "Phase 6 Product", "phase6-shop"));
        List<String> published = new CopyOnWriteArrayList<>();
        JdbcOutboxDispatcher dispatcherOne = new JdbcOutboxDispatcher(
                named, transactions,
                (topic, key, payload) -> published.add(topic + ":" + key),
                eventProperties, clock
        );
        JdbcOutboxDispatcher dispatcherTwo = new JdbcOutboxDispatcher(
                named, transactions,
                (topic, key, payload) -> published.add(topic + ":" + key),
                eventProperties, clock
        );
        int dispatched;
        try (var executor = Executors.newFixedThreadPool(2)) {
            dispatched = executor.invokeAll(List.<Callable<Integer>>of(
                    dispatcherOne::dispatchBatch,
                    dispatcherTwo::dispatchBatch
            )).stream().mapToInt(future -> {
                try {
                    return future.get();
                } catch (Exception exception) {
                    throw new AssertionError(exception);
                }
            }).sum();
        }
        assertThat(dispatched).isEqualTo(1);
        assertThat(published).containsExactly("product-created:phase6-spu");
        assertThat(jdbc.queryForObject(
                "SELECT status FROM domain_event_outbox", String.class
        )).isEqualTo("PUBLISHED");

        JdbcInventoryReservationService reservations = new JdbcInventoryReservationService(
                named, transactions, clock
        );
        JdbcOrderExpirationService expirationOne = new JdbcOrderExpirationService(
                named, transactions, reservations, clock
        );
        JdbcOrderExpirationService expirationTwo = new JdbcOrderExpirationService(
                named, transactions, reservations, clock
        );
        int expired;
        try (var executor = Executors.newFixedThreadPool(2)) {
            expired = executor.invokeAll(List.<Callable<Integer>>of(
                    () -> expirationOne.expireBatch(10),
                    () -> expirationTwo.expireBatch(10)
            )).stream().mapToInt(future -> {
                try {
                    return future.get();
                } catch (Exception exception) {
                    throw new AssertionError(exception);
                }
            }).sum();
        }
        assertThat(expired).isEqualTo(2);
        assertThat(jdbc.queryForObject(
                """
                SELECT count(*) FROM orders
                 WHERE id IN ('phase6-order-linked', 'phase6-order-legacy')
                   AND status = 'CANCELLED'::"OrderStatus"
                """,
                Integer.class
        )).isEqualTo(2);
        assertThat(jdbc.queryForObject(
                "SELECT inventory_stock FROM inventories WHERE id = 'phase6-inventory'",
                Integer.class
        )).isEqualTo(5);
        assertThat(jdbc.queryForObject(
                """
                SELECT count(*) FROM reservation_inventories
                 WHERE id IN ('phase6-reservation-linked', 'phase6-reservation-legacy')
                   AND valid = true
                """,
                Integer.class
        )).isZero();
        assertThat(expirationOne.expireBatch(10)).isZero();
    }

    private void insertFixtures(JdbcTemplate jdbc) {
        jdbc.update("""
                INSERT INTO accounts(id, account_type, status, is_active, created_at, updated_at)
                VALUES ('phase6-user-one', 'USER'::"AccountType", 'ACTIVE'::"Status", true, 0, 0),
                       ('phase6-user-two', 'USER'::"AccountType", 'ACTIVE'::"Status", true, 0, 0),
                       ('phase6-shop', 'SHOP'::"AccountType", 'ACTIVE'::"Status", true, 0, 0)
                """);
        jdbc.update("""
                INSERT INTO account_profiles("accountId", name, created_at, updated_at)
                VALUES ('phase6-user-one', 'User One', 0, 0),
                       ('phase6-user-two', 'User Two', 0, 0),
                       ('phase6-shop', 'Phase 6 Shop', 0, 0)
                """);
        jdbc.update("""
                INSERT INTO user_behavior("accountId", sex, date_of_birth, created_at, updated_at)
                VALUES ('phase6-user-one', 'FEMALE'::"Sex", TIMESTAMP '1970-01-01', 0, 0),
                       ('phase6-user-two', 'FEMALE'::"Sex", TIMESTAMP '1970-01-01', 0, 0)
                """);
        jdbc.update("""
                INSERT INTO notification_threads(
                    id, noti_thread_user_id, is_active, created_at, updated_at
                ) VALUES ('phase6-thread-one', 'phase6-user-one', true, 0, 0),
                         ('phase6-thread-two', 'phase6-user-two', true, 0, 0)
                """);
        jdbc.update("""
                INSERT INTO shop_business("accountId", business_name, business_type, created_at, updated_at)
                VALUES ('phase6-shop', 'Phase 6 Shop', 'retail', 0, 0)
                """);
        jdbc.update("""
                INSERT INTO "Brand"(id, name, image, initial, is_active, created_at, updated_at)
                VALUES ('phase6-brand', 'Phase 6 Brand', '', 'P', true, 0, 0)
                """);
        jdbc.update("""
                INSERT INTO "Category"(id, name, is_active, created_at, updated_at)
                VALUES ('phase6-category', 'Phase 6 Category', true, 0, 0)
                """);
        jdbc.update("""
                INSERT INTO "Spu"(
                    id, name, "brandId", "categoryId", "isMarketable", status,
                    "shopBusinessId", is_active, created_at, updated_at
                ) VALUES (
                    'phase6-spu', 'Phase 6 Product', 'phase6-brand', 'phase6-category',
                    true, 1, 'phase6-shop', true, 0, 0
                )
                """);
        jdbc.update("""
                INSERT INTO "Sku"(
                    id, name, price, num, "spuId", status, is_active, created_at, updated_at
                ) VALUES ('phase6-sku', 'Phase 6 SKU', 1000, 5, 'phase6-spu', 1, true, 0, 0)
                """);
        jdbc.update("""
                INSERT INTO inventories(
                    id, inventory_location, inventory_stock, inventory_product_id,
                    "shopBusinessId", is_active, created_at, updated_at
                ) VALUES (
                    'phase6-inventory', 'fixture', 3, 'phase6-sku',
                    'phase6-shop', true, 0, 0
                )
                """);
        jdbc.update("""
                INSERT INTO discounts(
                    id, discount_name, discount_description, discount_type, discount_value,
                    discount_code, discount_start_dates, discount_end_dates,
                    discount_max_uses, discount_uses_count, discount_users_used,
                    discount_max_uses_per_user, discount_min_order_value, discount_shop,
                    discount_is_active, discount_applies_to, discount_product_ids,
                    is_active, created_at, updated_at
                ) VALUES (
                    'phase6-discount', 'Phase 6 Discount', 'fixture', 'percentage', 10,
                    'PHASE6', TIMESTAMP '2026-01-01', TIMESTAMP '2027-01-01',
                    100, 0, ARRAY[]::text[], 1, 0, 'phase6-shop', true,
                    'all'::"DiscountAppliesTo", ARRAY[]::text[], true, 0, 0
                )
                """);
        jdbc.update("""
                INSERT INTO orders(
                    id, user_id, "shopBusinessId", status, expired_at,
                    payment_info, shipping_fee, shipping_street,
                    "total_discount ", total_price, is_active, created_at, updated_at
                ) VALUES (
                    'phase6-order-linked', 'phase6-user-one', 'phase6-shop',
                    'PENDING'::"OrderStatus", TIMESTAMP '2026-07-02 04:00:00',
                    '{}'::jsonb, 0, 'fixture', 0, 1000, true, 0, 0
                ), (
                    'phase6-order-legacy', 'phase6-user-two', 'phase6-shop',
                    'PENDING'::"OrderStatus", TIMESTAMP '2026-07-02 04:00:00',
                    '{}'::jsonb, 0, 'fixture', 0, 1000, true, 0, 0
                )
                """);
        jdbc.update("""
                INSERT INTO order_items(
                    id, "orderId", "inventoryId", quantity, price,
                    is_active, created_at, updated_at
                ) VALUES ('phase6-item-linked', 'phase6-order-linked', 'phase6-inventory', 1, 1000, true, 0, 0),
                         ('phase6-item-legacy', 'phase6-order-legacy', 'phase6-inventory', 1, 1000, true, 0, 0)
                """);
        jdbc.update("""
                INSERT INTO reservation_inventories(
                    id, inventory_id, user_id, quantity, expired_at,
                    "isConfirmed", valid, is_active, created_at, updated_at, order_id
                ) VALUES (
                    'phase6-reservation-linked', 'phase6-inventory', 'phase6-user-one', 1,
                    TIMESTAMP '2026-07-02 04:00:00', false, true, true, 0, 0,
                    'phase6-order-linked'
                ), (
                    'phase6-reservation-legacy', 'phase6-inventory', 'phase6-user-two', 1,
                    TIMESTAMP '2026-07-02 04:00:00', false, true, true, 0, 0, NULL
                )
                """);
    }
}
