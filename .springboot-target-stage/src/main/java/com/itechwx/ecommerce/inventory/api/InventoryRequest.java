package com.itechwx.ecommerce.inventory.api;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record InventoryRequest(
        @NotBlank @Size(max = 128) String productId,
        @Size(max = 500) String location,
        @Min(1) int stock
) {
}
