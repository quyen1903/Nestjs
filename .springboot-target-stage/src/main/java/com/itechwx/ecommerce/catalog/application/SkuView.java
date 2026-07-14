package com.itechwx.ecommerce.catalog.application;

import java.util.List;

public record SkuView(
        String id,
        String name,
        int price,
        Integer stock,
        String image,
        List<String> images,
        String brandName,
        String attributes,
        Integer status
) {
}
