package com.itechwx.ecommerce.catalog.api;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record UpdateCategoryRequest(
        @Size(min = 1, max = 50) String name,
        @Min(0) Integer sort
) {
}
