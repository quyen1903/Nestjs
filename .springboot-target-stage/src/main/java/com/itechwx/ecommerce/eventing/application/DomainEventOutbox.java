package com.itechwx.ecommerce.eventing.application;

import java.math.BigDecimal;

public interface DomainEventOutbox {

    void productCreated(String productId, String productName, String shopId);

    void discountCreated(String discountId, String discountName, BigDecimal discountValue, String shopId);

    static DomainEventOutbox disabled() {
        return new DomainEventOutbox() {
            @Override
            public void productCreated(String productId, String productName, String shopId) {
            }

            @Override
            public void discountCreated(
                    String discountId,
                    String discountName,
                    BigDecimal discountValue,
                    String shopId
            ) {
            }
        };
    }
}
