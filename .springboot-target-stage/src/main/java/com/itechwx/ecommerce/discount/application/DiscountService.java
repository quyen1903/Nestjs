package com.itechwx.ecommerce.discount.application;

import java.util.List;

public interface DiscountService {

    DiscountView create(String shopId, CreateDiscountCommand command);

    List<DiscountView> listForShop(String shopId, int page, int limit);

    List<DiscountProductView> listEligibleProducts(String shopId, String code);

    DiscountQuote quoteCart(String userId, String shopId, String code, List<String> productIds);

    DiscountQuote consume(String userId, String shopId, String code, List<String> productIds);

    void delete(String shopId, String code);
}
