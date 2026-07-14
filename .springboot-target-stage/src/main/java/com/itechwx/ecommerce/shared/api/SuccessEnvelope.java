package com.itechwx.ecommerce.shared.api;

public record SuccessEnvelope<T>(
        String message,
        int statusCode,
        T metadata,
        String requestId
) {
    public static <T> SuccessEnvelope<T> of(int statusCode, T metadata, String requestId) {
        return new SuccessEnvelope<>("success", statusCode, metadata, requestId);
    }
}

