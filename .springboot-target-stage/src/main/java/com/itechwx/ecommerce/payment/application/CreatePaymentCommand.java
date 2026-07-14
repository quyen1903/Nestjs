package com.itechwx.ecommerce.payment.application;

import java.math.BigDecimal;
import java.util.Map;

public record CreatePaymentCommand(
        String orderId,
        BigDecimal requestedAmount,
        String requestedCurrency,
        String description,
        String customerId,
        Map<String, Object> metadata
) {
    public CreatePaymentCommand {
        metadata = metadata == null ? Map.of() : Map.copyOf(metadata);
    }
}
