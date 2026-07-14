package com.itechwx.ecommerce.catalog.api;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateSpuRequest(
        @NotBlank @Size(max = 100) String name,
        @Size(max = 200) String intro,
        @NotBlank @Size(max = 128) String brandId,
        @NotBlank @Size(max = 128) String categoryId,
        @Size(max = 20) List<@NotBlank @Size(max = 1000) String> images,
        @Size(max = 50) String afterSalesService,
        @Size(max = 100_000) String content,
        @Size(max = 3000) String attributeList,
        Boolean isMarketable,
        @Min(0) @Max(2) Integer status
) {
}
