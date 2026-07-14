package com.itechwx.ecommerce.payment.application;

import java.math.BigDecimal;

public record RefundPaymentCommand(String paymentIntentId, BigDecimal amount, String reason) {
}
