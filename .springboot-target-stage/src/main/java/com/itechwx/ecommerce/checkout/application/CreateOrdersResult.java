package com.itechwx.ecommerce.checkout.application;

import java.util.List;

public record CreateOrdersResult(List<OrderView> orders, int totalOrders, String message) {
    public CreateOrdersResult {
        orders = List.copyOf(orders);
    }
}
