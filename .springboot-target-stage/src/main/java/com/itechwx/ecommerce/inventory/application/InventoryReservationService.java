package com.itechwx.ecommerce.inventory.application;

import java.util.List;

public interface InventoryReservationService {

    List<ReservationView> reserve(String userId, List<ReservationRequest> requests);

    List<ReservationView> reserveForOrder(String userId, String orderId, List<ReservationRequest> requests);

    boolean release(String userId, String productId);

    boolean consume(String userId, String productId);

    boolean releaseForOrder(String orderId);

    boolean consumeForOrder(String orderId);

    int releaseExpired(int limit);
}
