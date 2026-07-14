package com.itechwx.ecommerce.catalog.api;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCategoryRequest(
        @NotBlank @Size(max = 50) String name,
        @Min(0) Integer sort,
        @Size(max = 128) String parentId
) {
}
