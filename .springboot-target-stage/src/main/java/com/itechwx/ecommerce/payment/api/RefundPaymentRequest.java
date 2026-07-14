package com.itechwx.ecommerce.payment.api;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record RefundPaymentRequest(
        @NotBlank @Size(max = 128) String paymentIntentId,
        @DecimalMin(value = "0", inclusive = false) BigDecimal amount,
        @Size(max = 64) String reason
) {
}
