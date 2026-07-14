package com.itechwx.ecommerce.catalog.api;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateProductRequest(
        @Size(min = 1, max = 100) String name,
        @Size(max = 200) String intro,
        @Size(min = 1, max = 128) String brandId,
        @Size(min = 1, max = 128) String categoryId,
        @Size(max = 20) List<@Size(max = 2000) String> images,
        @Size(max = 50) String afterSalesService,
        @Size(max = 100_000) String content,
        @Size(max = 3000) String attributeList,
        @Min(0) Integer price,
        @Min(0) Integer stock,
        @Size(max = 200) String image,
        @Size(max = 100) String brandName,
        @Size(max = 200) String attributes
) {
}
