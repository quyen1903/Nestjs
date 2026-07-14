package com.itechwx.ecommerce.discount.application;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record CreateDiscountCommand(
        String name,
        String description,
        String type,
        BigDecimal value,
        String code,
        Instant startsAt,
        Instant endsAt,
        int maxUses,
        int maxUsesPerUser,
        BigDecimal minimumOrderValue,
        String appliesTo,
        List<String> productIds
) {
}
