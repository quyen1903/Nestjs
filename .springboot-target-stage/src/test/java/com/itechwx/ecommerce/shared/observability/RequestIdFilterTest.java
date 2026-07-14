package com.itechwx.ecommerce.shared.observability;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RequestIdFilterTest {

    @Test
    void preservesSafeRequestId() {
        assertThat(RequestIdFilter.resolveRequestId("request_123.safe-value"))
                .isEqualTo("request_123.safe-value");
    }

    @Test
    void replacesUnsafeRequestId() {
        String requestId = RequestIdFilter.resolveRequestId("unsafe\r\nheader");

        assertThat(requestId)
                .doesNotContain("\r", "\n")
                .matches("[0-9a-f-]{36}");
    }
}

