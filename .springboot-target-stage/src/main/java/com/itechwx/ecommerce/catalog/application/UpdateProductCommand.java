package com.itechwx.ecommerce.catalog.application;

import java.util.List;

public record UpdateProductCommand(
        String name,
        String intro,
        String brandId,
        String categoryId,
        List<String> images,
        String afterSalesService,
        String content,
        String attributeList,
        Integer price,
        Integer stock,
        String image,
        String brandName,
        String attributes
) {
}
