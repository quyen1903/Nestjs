package com.itechwx.ecommerce.payment.api;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.Map;

public record CreatePaymentRequest(
        @NotBlank @Size(max = 128) String orderId,
        @DecimalMin(value = "0", inclusive = false) BigDecimal amount,
        @Size(min = 3, max = 3) String currency,
        @Size(max = 500) String description,
        @Size(max = 128) String customerId,
        @Size(max = 50) Map<String, Object> metadata
) {
}
