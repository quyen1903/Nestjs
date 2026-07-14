package com.itechwx.ecommerce.discount.application;

import java.util.List;

public record DiscountProductView(String id, String name, List<String> images, String shopId) {
}
