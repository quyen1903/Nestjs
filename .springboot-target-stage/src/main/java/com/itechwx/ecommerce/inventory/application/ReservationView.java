package com.itechwx.ecommerce.inventory.application;

import java.time.Instant;

public record ReservationView(
        String id,
        String inventoryId,
        String productId,
        String userId,
        int quantity,
        Instant expiresAt,
        boolean confirmed,
        boolean valid
) {
}
