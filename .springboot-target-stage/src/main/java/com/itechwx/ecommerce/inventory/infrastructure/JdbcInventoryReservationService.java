package com.itechwx.ecommerce.inventory.infrastructure;

import com.itechwx.ecommerce.inventory.application.InventoryReservationService;
import com.itechwx.ecommerce.inventory.application.ReservationRequest;
import com.itechwx.ecommerce.inventory.application.ReservationView;
import com.itechwx.ecommerce.shared.error.ApplicationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

public final class JdbcInventoryReservationService implements InventoryReservationService {

    private static final Duration HOLD_DURATION = Duration.ofMinutes(15);

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final TransactionTemplate transactionTemplate;
    private final Clock clock;

    public JdbcInventoryReservationService(
            NamedParameterJdbcTemplate jdbcTemplate,
            TransactionTemplate transactionTemplate,
            Clock clock
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.transactionTemplate = transactionTemplate;
        this.clock = clock;
    }

    @Override
    public List<ReservationView> reserve(String userId, List<ReservationRequest> requests) {
        return reserveInternal(userId, null, requests);
    }

    @Override
    public List<ReservationView> reserveForOrder(
            String userId,
            String orderId,
            List<ReservationRequest> requests
    ) {
        if (orderId == null || orderId.isBlank()) {
            throw new IllegalArgumentException("orderId is required");
        }
        return reserveInternal(userId, orderId, requests);
    }

    private List<ReservationView> reserveInternal(
            String userId,
            String orderId,
            List<ReservationRequest> requests
    ) {
        List<ReservationRequest> ordered = requests.stream()
                .sorted(Comparator.comparing(ReservationRequest::productId))
                .toList();
        return transactionTemplate.execute(status -> {
            List<ReservationView> reservations = new ArrayList<>();
            for (ReservationRequest request : ordered) {
                reservations.add(reserveOne(userId, orderId, request));
            }
            return List.copyOf(reservations);
        });
    }

    @Override
    public boolean release(String userId, String productId) {
        return transactionTemplate.execute(status -> transition(userId, productId, false));
    }

    @Override
    public boolean consume(String userId, String productId) {
        return transactionTemplate.execute(status -> transition(userId, productId, true));
    }

    @Override
    public boolean releaseForOrder(String orderId) {
        return transactionTemplate.execute(status -> transitionOrder(orderId, false));
    }

    @Override
    public boolean consumeForOrder(String orderId) {
        return transactionTemplate.execute(status -> transitionOrder(orderId, true));
    }

    @Override
    public int releaseExpired(int limit) {
        return transactionTemplate.execute(status -> {
            List<LockedReservation> expired = jdbcTemplate.query("""
                    SELECT reservation.id, reservation.inventory_id, reservation.quantity
                      FROM reservation_inventories reservation
                     WHERE reservation.valid = true
                       AND reservation."isConfirmed" = false
                       AND reservation.expired_at <= :now
                     ORDER BY reservation.expired_at, reservation.id
                     LIMIT :limit
                     FOR UPDATE SKIP LOCKED
                    """, new MapSqlParameterSource()
                    .addValue("now", Timestamp.from(clock.instant()))
                    .addValue("limit", limit), (resultSet, rowNumber) -> new LockedReservation(
                    resultSet.getString("id"),
                    resultSet.getString("inventory_id"),
                    resultSet.getInt("quantity"),
                    null,
                    null,
                    null,
                    false,
                    true
            ));
            for (LockedReservation reservation : expired) {
                restoreStock(reservation.inventoryId(), reservation.quantity());
                invalidate(reservation.id(), false);
            }
            return expired.size();
        });
    }

    private ReservationView reserveOne(String userId, String orderId, ReservationRequest request) {
        InventoryRow inventory = lockInventory(request.productId());
        LockedReservation existing = lockReservation(inventory.id(), userId);
        Instant now = clock.instant();
        if (existing != null && existing.valid() && !existing.confirmed()) {
            if (existing.expiresAt().isAfter(now)) {
                if (existing.quantity() == request.quantity()
                        && java.util.Objects.equals(existing.orderId(), orderId)) {
                    return view(existing, inventory.productId(), userId);
                }
                throw new ApplicationException(
                        HttpStatus.CONFLICT,
                        "RESERVATION_EXISTS",
                        "An active reservation already exists for this product."
                );
            }
            restoreStock(inventory.id(), existing.quantity());
            invalidate(existing.id(), false);
        }
        int decremented = jdbcTemplate.update("""
                UPDATE inventories
                   SET inventory_stock = inventory_stock - :quantity,
                       updated_at = :now
                 WHERE id = :inventoryId
                   AND is_active = true
                   AND inventory_stock >= :quantity
                """, new MapSqlParameterSource()
                .addValue("quantity", request.quantity())
                .addValue("now", clock.millis())
                .addValue("inventoryId", inventory.id()));
        if (decremented != 1) {
            throw new ApplicationException(
                    HttpStatus.CONFLICT,
                    "INSUFFICIENT_STOCK",
                    "Not enough stock is available."
            );
        }
        String id = existing == null ? UUID.randomUUID().toString() : existing.id();
        Instant expiresAt = now.plus(HOLD_DURATION);
        jdbcTemplate.update("""
                INSERT INTO reservation_inventories(
                    id, inventory_id, user_id, quantity, expired_at,
                    "isConfirmed", valid, is_active, created_at, updated_at, order_id
                ) VALUES (
                    :id, :inventoryId, :userId, :quantity, :expiresAt,
                    false, true, true, :now, :now, :orderId
                )
                ON CONFLICT (inventory_id, user_id) DO UPDATE SET
                    quantity = EXCLUDED.quantity,
                    expired_at = EXCLUDED.expired_at,
                    "isConfirmed" = false,
                    valid = true,
                    is_active = true,
                    order_id = EXCLUDED.order_id,
                    updated_at = EXCLUDED.updated_at
                """, new MapSqlParameterSource()
                .addValue("id", id)
                .addValue("inventoryId", inventory.id())
                .addValue("userId", userId)
                .addValue("quantity", request.quantity())
                .addValue("expiresAt", Timestamp.from(expiresAt))
                .addValue("orderId", orderId)
                .addValue("now", clock.millis()));
        return new ReservationView(
                id, inventory.id(), inventory.productId(), userId,
                request.quantity(), expiresAt, false, true
        );
    }

    private boolean transition(String userId, String productId, boolean consume) {
        InventoryRow inventory = lockInventory(productId);
        LockedReservation reservation = lockReservation(inventory.id(), userId);
        if (reservation == null || !reservation.valid() || reservation.confirmed()) {
            return false;
        }
        if (consume && !reservation.expiresAt().isAfter(clock.instant())) {
            restoreStock(inventory.id(), reservation.quantity());
            invalidate(reservation.id(), false);
            return false;
        }
        if (consume) {
            invalidate(reservation.id(), true);
        } else {
            restoreStock(inventory.id(), reservation.quantity());
            invalidate(reservation.id(), false);
        }
        return true;
    }

    private boolean transitionOrder(String orderId, boolean consume) {
        List<LockedReservation> reservations = jdbcTemplate.query("""
                SELECT reservation.id, reservation.inventory_id, reservation.quantity,
                       reservation.expired_at, reservation.user_id, reservation.order_id,
                       reservation."isConfirmed", reservation.valid
                  FROM reservation_inventories reservation
                  JOIN inventories inventory ON inventory.id = reservation.inventory_id
                 WHERE reservation.order_id = :orderId
                 ORDER BY reservation.inventory_id
                 FOR UPDATE OF inventory, reservation
                """, new MapSqlParameterSource("orderId", orderId),
                (resultSet, rowNumber) -> new LockedReservation(
                        resultSet.getString("id"),
                        resultSet.getString("inventory_id"),
                        resultSet.getInt("quantity"),
                        resultSet.getTimestamp("expired_at").toInstant(),
                        resultSet.getString("user_id"),
                        resultSet.getString("order_id"),
                        resultSet.getBoolean("isConfirmed"),
                        resultSet.getBoolean("valid")
                ));
        if (reservations.isEmpty()) {
            return false;
        }
        if (consume && reservations.stream().anyMatch(row -> !row.valid() || row.confirmed())) {
            return false;
        }
        boolean changed = false;
        for (LockedReservation reservation : reservations) {
            if (!reservation.valid() || reservation.confirmed()) {
                continue;
            }
            if (!consume) {
                restoreStock(reservation.inventoryId(), reservation.quantity());
            }
            invalidate(reservation.id(), consume);
            changed = true;
        }
        return changed;
    }

    private InventoryRow lockInventory(String productId) {
        List<InventoryRow> rows = jdbcTemplate.query("""
                SELECT id, inventory_product_id
                  FROM inventories
                 WHERE inventory_product_id = :productId AND is_active = true
                 FOR UPDATE
                """, new MapSqlParameterSource("productId", productId),
                (resultSet, rowNumber) -> new InventoryRow(
                        resultSet.getString("id"), resultSet.getString("inventory_product_id")
                ));
        if (rows.isEmpty()) {
            throw new ApplicationException(HttpStatus.NOT_FOUND, "INVENTORY_NOT_FOUND", "Inventory not found.");
        }
        return rows.getFirst();
    }

    private LockedReservation lockReservation(String inventoryId, String userId) {
        List<LockedReservation> rows = jdbcTemplate.query("""
                SELECT id, inventory_id, quantity, expired_at, user_id, order_id,
                       "isConfirmed", valid
                  FROM reservation_inventories
                 WHERE inventory_id = :inventoryId AND user_id = :userId
                 FOR UPDATE
                """, new MapSqlParameterSource()
                .addValue("inventoryId", inventoryId)
                .addValue("userId", userId), (resultSet, rowNumber) -> new LockedReservation(
                resultSet.getString("id"),
                resultSet.getString("inventory_id"),
                resultSet.getInt("quantity"),
                resultSet.getTimestamp("expired_at").toInstant(),
                resultSet.getString("user_id"),
                resultSet.getString("order_id"),
                resultSet.getBoolean("isConfirmed"),
                resultSet.getBoolean("valid")
        ));
        return rows.isEmpty() ? null : rows.getFirst();
    }

    private void restoreStock(String inventoryId, int quantity) {
        jdbcTemplate.update("""
                UPDATE inventories
                   SET inventory_stock = inventory_stock + :quantity, updated_at = :now
                 WHERE id = :inventoryId
                """, new MapSqlParameterSource()
                .addValue("inventoryId", inventoryId)
                .addValue("quantity", quantity)
                .addValue("now", clock.millis()));
    }

    private void invalidate(String reservationId, boolean confirmed) {
        jdbcTemplate.update("""
                UPDATE reservation_inventories
                   SET valid = false, "isConfirmed" = :confirmed, updated_at = :now
                 WHERE id = :id AND valid = true
                """, new MapSqlParameterSource()
                .addValue("id", reservationId)
                .addValue("confirmed", confirmed)
                .addValue("now", clock.millis()));
    }

    private ReservationView view(LockedReservation row, String productId, String userId) {
        return new ReservationView(
                row.id(), row.inventoryId(), productId, userId, row.quantity(),
                row.expiresAt(), row.confirmed(), row.valid()
        );
    }

    private record InventoryRow(String id, String productId) {
    }

    private record LockedReservation(
            String id,
            String inventoryId,
            int quantity,
            Instant expiresAt,
            String userId,
            String orderId,
            boolean confirmed,
            boolean valid
    ) {
    }
}
