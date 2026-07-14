package com.itechwx.ecommerce.payment.application;

public record WebhookResult(boolean received, boolean replayed, String outcome) {
}
