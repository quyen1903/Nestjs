package com.itechwx.ecommerce.catalog.api;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateSkuRequest(
        @NotBlank @Size(max = 200) String name,
        @Min(0) int price,
        @Min(0) Integer stock,
        @Size(max = 200) String image,
        @Size(max = 20) List<@NotBlank @Size(max = 2000) String> images,
        @Size(max = 100) String brandName,
        @Size(max = 200) String attributes,
        @Min(0) @Max(1) Integer status
) {
}
