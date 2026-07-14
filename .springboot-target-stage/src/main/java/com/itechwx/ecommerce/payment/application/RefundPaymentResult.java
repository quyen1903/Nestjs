package com.itechwx.ecommerce.payment.application;

public record RefundPaymentResult(boolean success, String refundId, String status) {
}
