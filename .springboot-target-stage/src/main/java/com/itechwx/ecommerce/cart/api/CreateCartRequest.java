package com.itechwx.ecommerce.cart.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record CreateCartRequest(@NotNull @Valid CartProductRequest product) {
}
