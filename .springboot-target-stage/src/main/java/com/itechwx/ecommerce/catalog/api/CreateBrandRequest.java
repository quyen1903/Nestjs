package com.itechwx.ecommerce.catalog.api;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateBrandRequest(
        @NotBlank @Size(max = 100) String name,
        @Size(max = 1000) String image,
        @Size(max = 1) String initial,
        @Min(0) Integer sort
) {
}
