package com.itechwx.ecommerce.shared.error;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record ApiErrorResponse(
        Instant timestamp,
        int statusCode,
        String error,
        String code,
        String message,
        String requestId,
        String path,
        Map<String, List<String>> violations
) {
    public static ApiErrorResponse of(
            int statusCode,
            String error,
            String code,
            String message,
            String requestId,
            String path,
            Map<String, List<String>> violations
    ) {
        return new ApiErrorResponse(
                Instant.now(),
                statusCode,
                error,
                code,
                message,
                requestId,
                path,
                violations == null ? Map.of() : Map.copyOf(violations)
        );
    }
}

