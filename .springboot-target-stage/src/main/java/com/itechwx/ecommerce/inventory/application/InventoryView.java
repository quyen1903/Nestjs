package com.itechwx.ecommerce.inventory.application;

public record InventoryView(
        String id,
        String productId,
        String shopId,
        String location,
        int stock
) {
}
