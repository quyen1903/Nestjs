package com.itechwx.ecommerce.checkout.application;

import java.math.BigDecimal;

public record CheckoutTotals(
        BigDecimal totalPrice,
        BigDecimal feeShip,
        BigDecimal totalDiscount,
        BigDecimal totalCheckout
) {
}
