package com.itechwx.ecommerce.discount.application;

import java.math.BigDecimal;

public record DiscountQuote(BigDecimal totalOrder, BigDecimal discount, BigDecimal totalPrice) {
}
