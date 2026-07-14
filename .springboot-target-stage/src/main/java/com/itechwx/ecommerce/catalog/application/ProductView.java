package com.itechwx.ecommerce.catalog.application;

import java.util.List;

public record ProductView(
        String id,
        String name,
        String intro,
        String brandId,
        String categoryId,
        List<String> images,
        String afterSalesService,
        String content,
        String attributeList,
        boolean isMarketable,
        int status,
        String shopBusinessId,
        long createdAt,
        long updatedAt,
        BrandView brand,
        CategoryView category,
        List<SkuView> skus
) {
}
