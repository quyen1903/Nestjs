package com.itechwx.ecommerce.catalog.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record CreateProductRequest(
        @NotNull @Valid CreateSpuRequest spu,
        @NotNull @Valid CreateSkuRequest sku
) {
}
