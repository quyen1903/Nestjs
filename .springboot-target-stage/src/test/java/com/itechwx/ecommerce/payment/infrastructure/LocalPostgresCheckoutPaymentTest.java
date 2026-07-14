package com.itechwx.ecommerce.payment.infrastructure;

import com.itechwx.ecommerce.auth.domain.ShopPrincipal;
import com.itechwx.ecommerce.cart.infrastructure.JdbcCartService;
import com.itechwx.ecommerce.checkout.application.CheckoutCommand;
import com.itechwx.ecommerce.checkout.application.CheckoutProductSelection;
import com.itechwx.ecommerce.checkout.application.CheckoutShopSelection;
import com.itechwx.ecommerce.checkout.infrastructure.JdbcCheckoutService;
import com.itechwx.ecommerce.discount.infrastructure.JdbcDiscountService;
import com.itechwx.ecommerce.inventory.application.InventoryReservationService;
import com.itechwx.ecommerce.inventory.application.ReservationRequest;
import com.itechwx.ecommerce.inventory.application.ReservationView;
import com.itechwx.ecommerce.inventory.infrastructure.JdbcInventoryReservationService;
import com.itechwx.ecommerce.payment.application.CreatePaymentCommand;
import com.itechwx.ecommerce.payment.application.GatewayPaymentIntent;
import com.itechwx.ecommerce.payment.application.GatewayRefund;
import com.itechwx.ecommerce.payment.application.PaymentGateway;
import com.itechwx.ecommerce.payment.application.RefundPaymentCommand;
import com.itechwx.ecommerce.payment.application.VerifiedPaymentEvent;
import com.itechwx.ecommerce.payment.config.StripeProperties;
import com.itechwx.ecommerce.shared.error.ApplicationException;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.Executors;
import java.util.concurrent.Callable;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@EnabledIfEnvironmentVariable(named = "MIGRATION_TEST_DB_URL", matches = ".+")
class LocalPostgresCheckoutPaymentTest {

    private static final Instant NOW = Instant.parse("2026-07-02T06:00:00Z");

    @Test
    void provesTransactionalCheckoutPaymentReplayAndCompensation() throws Exception {
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

        insertUser(jdbc, "phase5-user-one", "phase5-user-one@example.test");
        insertUser(jdbc, "phase5-user-two", "phase5-user-two@example.test");
        insertUser(jdbc, "phase5-user-three", "phase5-user-three@example.test");
        insertUser(jdbc, "phase5-user-rollback", "phase5-user-rollback@example.test");
        insertShopProductAndInventory(jdbc);

        JdbcCartService carts = new JdbcCartService(named, transactions, clock);
        JdbcInventoryReservationService reservations = new JdbcInventoryReservationService(
                named, transactions, clock
        );
        JdbcDiscountService discounts = new JdbcDiscountService(named, transactions, clock);
        JdbcCheckoutService checkout = new JdbcCheckoutService(
                named, transactions, reservations, discounts, clock
        );

        carts.add("phase5-user-one", "phase5-sku", 2);
        String cartOne = cartId(jdbc, "phase5-user-one");
        CheckoutCommand commandOne = command(cartOne, 2);
        assertThat(checkout.review("phase5-user-one", commandOne)
                .checkoutOrder().totalCheckout()).isEqualByComparingTo("2000.00");

        List<String> orderIds;
        Callable<String> firstCheckout = () -> checkout.createOrders(
                "phase5-user-one", "phase5-checkout-key", commandOne
        ).orders().getFirst().id();
        Callable<String> replayCheckout = () -> checkout.createOrders(
                "phase5-user-one", "phase5-checkout-key", commandOne
        ).orders().getFirst().id();
        try (var executor = Executors.newFixedThreadPool(2)) {
            orderIds = executor.invokeAll(List.of(firstCheckout, replayCheckout)).stream().map(future -> {
                try {
                    return future.get();
                } catch (Exception exception) {
                    throw new AssertionError(exception);
                }
            }).toList();
        }
        assertThat(orderIds).hasSize(2).allMatch(orderIds.getFirst()::equals);
        String orderOne = orderIds.getFirst();
        assertThat(stock(jdbc)).isEqualTo(3);
        assertThat(jdbc.queryForObject(
                "SELECT order_id FROM reservation_inventories WHERE order_id = ?",
                String.class, orderOne
        )).isEqualTo(orderOne);
        assertThat(jdbc.queryForObject(
                "SELECT count(*) FROM orders WHERE user_id = 'phase5-user-one'",
                Integer.class
        )).isEqualTo(1);

        StripeProperties properties = new StripeProperties(true, "sk_test_phase5", "whsec_phase5", "usd");
        JdbcPaymentStore paymentStore = new JdbcPaymentStore(
                named, transactions, reservations, properties, clock
        );
        FakePaymentGateway gateway = new FakePaymentGateway();
        DefaultPaymentService payments = new DefaultPaymentService(gateway, paymentStore, properties);
        var payment = payments.createPayment("phase5-user-one", new CreatePaymentCommand(
                orderOne, new BigDecimal("0.01"), "eur", "fixture", "attacker-customer", java.util.Map.of()
        ));
        assertThat(payment.paymentIntentId()).isEqualTo("pi_" + orderOne);
        assertThat(gateway.createdAmounts).containsExactly(200_000L);
        assertThat(gateway.createdCurrencies).containsExactly("usd");
        assertThat(payments.createPayment("phase5-user-one", new CreatePaymentCommand(
                orderOne, null, null, null, null, java.util.Map.of()
        )).paymentIntentId()).isEqualTo(payment.paymentIntentId());
        assertThat(gateway.createdAmounts).hasSize(1);

        gateway.nextEvent = new VerifiedPaymentEvent(
                "evt-phase5-success", "payment_intent.succeeded", payment.paymentIntentId(),
                200_000, 200_000, "usd", "succeeded"
        );
        assertThat(payments.handleWebhook("verified-by-fake", new byte[]{1}).outcome())
                .isEqualTo("PROCESSED");
        assertThat(payments.handleWebhook("verified-by-fake", new byte[]{1}).replayed()).isTrue();
        assertThat(orderStatus(jdbc, orderOne)).isEqualTo("CONFIRMED");
        assertThat(stock(jdbc)).isEqualTo(3);
        assertThat(jdbc.queryForObject(
                "SELECT \"isConfirmed\" FROM reservation_inventories WHERE order_id = ?",
                Boolean.class, orderOne
        )).isTrue();

        ShopPrincipal owner = new ShopPrincipal(
                "phase5-shop", "device", "shop@example.test", Set.of("payment:refund")
        );
        var refundOne = payments.refund(
                owner, "phase5-refund-key",
                new RefundPaymentCommand(payment.paymentIntentId(), null, "requested_by_customer")
        );
        var refundReplay = payments.refund(
                owner, "phase5-refund-key",
                new RefundPaymentCommand(payment.paymentIntentId(), null, "requested_by_customer")
        );
        assertThat(refundReplay.refundId()).isEqualTo(refundOne.refundId());
        assertThat(gateway.refundKeys.stream().filter(key -> key.startsWith("refund:"))).hasSize(1);
        assertThatThrownBy(() -> payments.refund(
                owner, "phase5-second-full-refund",
                new RefundPaymentCommand(payment.paymentIntentId(), null, null)
        )).isInstanceOf(ApplicationException.class)
                .extracting(exception -> ((ApplicationException) exception).code())
                .isEqualTo("REFUND_LIMIT_EXCEEDED");
        ShopPrincipal otherShop = new ShopPrincipal(
                "phase5-other-shop", "device", "other@example.test", Set.of("payment:refund")
        );
        assertThatThrownBy(() -> payments.refund(
                otherShop, "other-key",
                new RefundPaymentCommand(payment.paymentIntentId(), null, null)
        )).isInstanceOf(ApplicationException.class)
                .extracting(exception -> ((ApplicationException) exception).code())
                .isEqualTo("PAYMENT_NOT_FOUND");

        carts.add("phase5-user-two", "phase5-sku", 1);
        String orderTwo = checkout.createOrders(
                "phase5-user-two", "phase5-two", command(cartId(jdbc, "phase5-user-two"), 1)
        ).orders().getFirst().id();
        paymentStore.attachPaymentIntent(orderTwo, intent("pi-phase5-failed", 100_000));
        assertThat(paymentStore.applyEvent(new VerifiedPaymentEvent(
                "evt-phase5-failed", "payment_intent.payment_failed", "pi-phase5-failed",
                100_000, 0, "usd", "requires_payment_method"
        )).outcome()).isEqualTo("PROCESSED");
        assertThat(paymentStore.applyEvent(new VerifiedPaymentEvent(
                "evt-phase5-failed", "payment_intent.payment_failed", "pi-phase5-failed",
                100_000, 0, "usd", "requires_payment_method"
        )).replayed()).isTrue();
        assertThat(orderStatus(jdbc, orderTwo)).isEqualTo("CANCELLED");
        assertThat(stock(jdbc)).isEqualTo(3);
        gateway.nextEvent = new VerifiedPaymentEvent(
                "evt-phase5-late-success", "payment_intent.succeeded", "pi-phase5-failed",
                100_000, 100_000, "usd", "succeeded"
        );
        assertThat(payments.handleWebhook("verified-by-fake", new byte[]{1}).outcome())
                .isEqualTo("COMPENSATED");
        assertThat(orderStatus(jdbc, orderTwo)).isEqualTo("CANCELLED");
        assertThat(stock(jdbc)).isEqualTo(3);

        carts.add("phase5-user-three", "phase5-sku", 1);
        String orderThree = checkout.createOrders(
                "phase5-user-three", "phase5-three", command(cartId(jdbc, "phase5-user-three"), 1)
        ).orders().getFirst().id();
        paymentStore.attachPaymentIntent(orderThree, intent("pi-phase5-mismatch", 100_000));
        gateway.nextEvent = new VerifiedPaymentEvent(
                "evt-phase5-mismatch", "payment_intent.succeeded", "pi-phase5-mismatch",
                1, 1, "usd", "succeeded"
        );
        assertThat(payments.handleWebhook("verified-by-fake", new byte[]{1}).outcome())
                .isEqualTo("COMPENSATED");
        assertThat(payments.handleWebhook("verified-by-fake", new byte[]{1}).replayed()).isTrue();
        assertThat(gateway.refundKeys.stream()
                .filter("compensation:evt-phase5-mismatch"::equals)).hasSize(1);
        assertThat(orderStatus(jdbc, orderThree)).isEqualTo("CANCELLED");
        assertThat(stock(jdbc)).isEqualTo(3);

        carts.add("phase5-user-rollback", "phase5-sku", 1);
        String rollbackCart = cartId(jdbc, "phase5-user-rollback");
        InventoryReservationService failAfterReserve = failingReservationService(reservations);
        JdbcCheckoutService failingCheckout = new JdbcCheckoutService(
                named, transactions, failAfterReserve, discounts, clock
        );
        assertThatThrownBy(() -> failingCheckout.createOrders(
                "phase5-user-rollback", "phase5-rollback", command(rollbackCart, 1)
        )).isInstanceOf(ApplicationException.class)
                .extracting(exception -> ((ApplicationException) exception).code())
                .isEqualTo("FORCED_ROLLBACK");
        assertThat(stock(jdbc)).isEqualTo(3);
        assertThat(jdbc.queryForObject(
                "SELECT count(*) FROM orders WHERE user_id = 'phase5-user-rollback'",
                Integer.class
        )).isZero();
        assertThat(jdbc.queryForObject(
                "SELECT count(*) FROM cart_products WHERE \"cart_product_cartId\" = ?",
                Integer.class, rollbackCart
        )).isEqualTo(1);
    }

    private InventoryReservationService failingReservationService(
            InventoryReservationService delegate
    ) {
        return new InventoryReservationService() {
            @Override
            public List<ReservationView> reserve(String userId, List<ReservationRequest> requests) {
                return delegate.reserve(userId, requests);
            }

            @Override
            public List<ReservationView> reserveForOrder(
                    String userId, String orderId, List<ReservationRequest> requests
            ) {
                delegate.reserveForOrder(userId, orderId, requests);
                throw new ApplicationException(
                        HttpStatus.CONFLICT, "FORCED_ROLLBACK", "Forced rollback fixture."
                );
            }

            @Override
            public boolean release(String userId, String productId) {
                return delegate.release(userId, productId);
            }

            @Override
            public boolean consume(String userId, String productId) {
                return delegate.consume(userId, productId);
            }

            @Override
            public boolean releaseForOrder(String orderId) {
                return delegate.releaseForOrder(orderId);
            }

            @Override
            public boolean consumeForOrder(String orderId) {
                return delegate.consumeForOrder(orderId);
            }

            @Override
            public int releaseExpired(int limit) {
                return delegate.releaseExpired(limit);
            }
        };
    }

    private CheckoutCommand command(String cartId, int quantity) {
        return new CheckoutCommand(
                cartId,
                "Phase 5 shipping address",
                List.of(new CheckoutShopSelection(
                        "phase5-shop", List.of(),
                        List.of(new CheckoutProductSelection("phase5-sku", quantity))
                ))
        );
    }

    private GatewayPaymentIntent intent(String id, long amount) {
        return new GatewayPaymentIntent(
                id, "secret-" + id, "requires_payment_method", amount, 0, "usd", 1
        );
    }

    private String cartId(JdbcTemplate jdbc, String userId) {
        return jdbc.queryForObject(
                "SELECT id FROM carts WHERE \"cart_userId\" = ?", String.class, userId
        );
    }

    private int stock(JdbcTemplate jdbc) {
        return jdbc.queryForObject(
                "SELECT inventory_stock FROM inventories WHERE inventory_product_id = 'phase5-sku'",
                Integer.class
        );
    }

    private String orderStatus(JdbcTemplate jdbc, String orderId) {
        return jdbc.queryForObject(
                "SELECT status::text FROM orders WHERE id = ?", String.class, orderId
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
                INSERT INTO account_profiles("accountId", name, address, created_at, updated_at)
                VALUES (?, ?, 'Profile address', 0, 0)
                """, id, id);
        jdbc.update("""
                INSERT INTO user_behavior("accountId", sex, date_of_birth, created_at, updated_at)
                VALUES (?, 'FEMALE'::"Sex", TIMESTAMP '1970-01-01', 0, 0)
                """, id);
    }

    private void insertShopProductAndInventory(JdbcTemplate jdbc) {
        jdbc.update("""
                INSERT INTO accounts(id, account_type, status, is_active, created_at, updated_at)
                VALUES ('phase5-shop', 'SHOP'::"AccountType", 'ACTIVE'::"Status", true, 0, 0),
                       ('phase5-other-shop', 'SHOP'::"AccountType", 'ACTIVE'::"Status", true, 0, 0)
                """);
        jdbc.update("""
                INSERT INTO shop_business("accountId", business_name, business_type, created_at, updated_at)
                VALUES ('phase5-shop', 'Phase 5 Shop', 'retail', 0, 0),
                       ('phase5-other-shop', 'Other Shop', 'retail', 0, 0)
                """);
        jdbc.update("""
                INSERT INTO "Brand"(id, name, image, initial, is_active, created_at, updated_at)
                VALUES ('phase5-brand', 'Phase 5 Brand', '', 'P', true, 0, 0)
                """);
        jdbc.update("""
                INSERT INTO "Category"(id, name, is_active, created_at, updated_at)
                VALUES ('phase5-category', 'Phase 5 Category', true, 0, 0)
                """);
        jdbc.update("""
                INSERT INTO "Spu"(
                    id, name, "brandId", "categoryId", "isMarketable", status,
                    "shopBusinessId", is_active, created_at, updated_at
                ) VALUES (
                    'phase5-spu', 'Phase 5 Product', 'phase5-brand', 'phase5-category',
                    true, 1, 'phase5-shop', true, 0, 0
                )
                """);
        jdbc.update("""
                INSERT INTO "Sku"(id, name, price, num, "spuId", status, is_active, created_at, updated_at)
                VALUES ('phase5-sku', 'Phase 5 SKU', 1000, 5, 'phase5-spu', 1, true, 0, 0)
                """);
        jdbc.update("""
                INSERT INTO inventories(
                    id, inventory_location, inventory_stock, inventory_product_id,
                    "shopBusinessId", is_active, created_at, updated_at
                ) VALUES (
                    'phase5-inventory', 'fixture', 5, 'phase5-sku',
                    'phase5-shop', true, 0, 0
                )
                """);
    }

    private static final class FakePaymentGateway implements PaymentGateway {
        private final List<Long> createdAmounts = new ArrayList<>();
        private final List<String> createdCurrencies = new ArrayList<>();
        private final List<String> refundKeys = new ArrayList<>();
        private final java.util.Map<String, GatewayPaymentIntent> intents = new java.util.HashMap<>();
        private VerifiedPaymentEvent nextEvent;

        @Override
        public GatewayPaymentIntent createPaymentIntent(
                String orderId, long amount, String currency, String description, String idempotencyKey
        ) {
            createdAmounts.add(amount);
            createdCurrencies.add(currency);
            GatewayPaymentIntent intent = new GatewayPaymentIntent(
                    "pi_" + orderId, "secret", "requires_payment_method", amount, 0, currency, 1
            );
            intents.put(intent.id(), intent);
            return intent;
        }

        @Override
        public GatewayPaymentIntent retrievePaymentIntent(String paymentIntentId) {
            return intents.get(paymentIntentId);
        }

        @Override
        public GatewayRefund refund(
                String paymentIntentId, Long amount, String reason, String idempotencyKey
        ) {
            refundKeys.add(idempotencyKey);
            return new GatewayRefund("re_" + idempotencyKey.hashCode(), "succeeded");
        }

        @Override
        public String createCustomer(
                String userId, String email, String name, String idempotencyKey
        ) {
            return "cus_" + userId;
        }

        @Override
        public VerifiedPaymentEvent verifyWebhook(String signature, byte[] rawBody) {
            return nextEvent;
        }
    }
}
