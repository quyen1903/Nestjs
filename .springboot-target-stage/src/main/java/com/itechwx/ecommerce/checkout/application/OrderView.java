package com.itechwx.ecommerce.checkout.application;

import java.math.BigDecimal;
import java.time.Instant;

public record OrderView(
        String id,
        String userId,
        String shopBusinessId,
        String status,
        BigDecimal totalDiscount,
        BigDecimal shippingFee,
        String shippingAddress,
        BigDecimal totalPrice,
        String paymentIntentId,
        Instant expiredAt
) {
}
