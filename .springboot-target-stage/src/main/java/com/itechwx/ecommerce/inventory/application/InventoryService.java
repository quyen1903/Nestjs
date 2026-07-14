package com.itechwx.ecommerce.inventory.application;

public interface InventoryService {

    InventoryView addStock(String shopId, String productId, int stock, String location);
}
