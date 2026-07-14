package com.itechwx.ecommerce.cart.application;

import java.util.List;

public interface CartService {

    CartItemView add(String userId, String productId, int quantity);

    List<CartItemView> update(String userId, List<CartUpdateItem> items);

    int delete(String userId, String productId);

    List<CartItemView> list(String userId);
}
