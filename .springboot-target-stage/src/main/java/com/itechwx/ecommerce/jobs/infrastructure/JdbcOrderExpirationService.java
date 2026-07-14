package com.itechwx.ecommerce.jobs.infrastructure;

import com.itechwx.ecommerce.inventory.application.InventoryReservationService;
import com.itechwx.ecommerce.jobs.application.OrderExpirationService;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import java.sql.Timestamp;
import java.time.Clock;
import java.util.List;

public final class JdbcOrderExpirationService implements OrderExpirationService {

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final TransactionTemplate transactionTemplate;
    private final InventoryReservationService reservationService;
    private final Clock clock;

    public JdbcOrderExpirationService(
            NamedParameterJdbcTemplate jdbcTemplate,
            TransactionTemplate transactionTemplate,
            InventoryReservationService reservationService,
            Clock clock
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.transactionTemplate = transactionTemplate;
        this.reservationService = reservationService;
        this.clock = clock;
    }

    @Override
    public int expireBatch(int limit) {
        if (limit < 1 || limit > 1_000) {
            throw new IllegalArgumentException("limit must be between 1 and 1000");
        }
        int expired = 0;
        while (expired < limit) {
            Boolean changed = transactionTemplate.execute(status -> expireOne());
            if (!Boolean.TRUE.equals(changed)) {
                break;
            }
            expired++;
        }
        return expired;
    }

    private boolean expireOne() {
        List<ExpiredOrder> orders = jdbcTemplate.query("""
                SELECT id, user_id
                  FROM orders
                 WHERE status = CAST('PENDING' AS "OrderStatus")
                   AND expired_at <= :now
                 ORDER BY expired_at, id
                 LIMIT 1
                 FOR UPDATE SKIP LOCKED
                """, new MapSqlParameterSource("now", Timestamp.from(clock.instant())),
                (resultSet, rowNumber) -> new ExpiredOrder(
                        resultSet.getString("id"), resultSet.getString("user_id")
                ));
        if (orders.isEmpty()) {
            return false;
        }
        ExpiredOrder order = orders.getFirst();
        boolean orderLinked = reservationService.releaseForOrder(order.id());
        if (!orderLinked) {
            releaseLegacyReservations(order);
        }
        int updated = jdbcTemplate.update("""
                UPDATE orders
                   SET status = CAST('CANCELLED' AS "OrderStatus"), updated_at = :now
                 WHERE id = :orderId AND status = CAST('PENDING' AS "OrderStatus")
                """, new MapSqlParameterSource()
                .addValue("now", clock.millis())
                .addValue("orderId", order.id()));
        return updated == 1;
    }

    private void releaseLegacyReservations(ExpiredOrder order) {
        List<LegacyReservation> reservations = jdbcTemplate.query("""
                SELECT reservation.id, reservation.inventory_id, reservation.quantity
                  FROM reservation_inventories reservation
                  JOIN inventories inventory ON inventory.id = reservation.inventory_id
                 WHERE reservation.id IN (
                       SELECT candidate.id
                         FROM order_items item
                         JOIN reservation_inventories candidate
                           ON candidate.inventory_id = item."inventoryId"
                          AND candidate.user_id = :userId
                          AND candidate.order_id IS NULL
                        WHERE item."orderId" = :orderId
                 )
                   AND reservation.valid = true
                   AND reservation."isConfirmed" = false
                 ORDER BY reservation.inventory_id
                 FOR UPDATE OF inventory, reservation
                """, new MapSqlParameterSource()
                .addValue("orderId", order.id())
                .addValue("userId", order.userId()),
                (resultSet, rowNumber) -> new LegacyReservation(
                        resultSet.getString("id"),
                        resultSet.getString("inventory_id"),
                        resultSet.getInt("quantity")
                ));
        for (LegacyReservation reservation : reservations) {
            jdbcTemplate.update("""
                    UPDATE inventories
                       SET inventory_stock = inventory_stock + :quantity, updated_at = :now
                     WHERE id = :inventoryId
                    """, new MapSqlParameterSource()
                    .addValue("quantity", reservation.quantity())
                    .addValue("now", clock.millis())
                    .addValue("inventoryId", reservation.inventoryId()));
            jdbcTemplate.update("""
                    UPDATE reservation_inventories
                       SET valid = false, "isConfirmed" = false, updated_at = :now
                     WHERE id = :id AND valid = true
                    """, new MapSqlParameterSource()
                    .addValue("now", clock.millis())
                    .addValue("id", reservation.id()));
        }
    }

    private record ExpiredOrder(String id, String userId) {
    }

    private record LegacyReservation(String id, String inventoryId, int quantity) {
    }
}
