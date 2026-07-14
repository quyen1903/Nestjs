package com.itechwx.ecommerce.catalog.application;

import java.util.List;

public record CreateSpuCommand(
        String name,
        String intro,
        String brandId,
        String categoryId,
        List<String> images,
        String afterSalesService,
        String content,
        String attributeList,
        Boolean isMarketable,
        Integer status
) {
}
