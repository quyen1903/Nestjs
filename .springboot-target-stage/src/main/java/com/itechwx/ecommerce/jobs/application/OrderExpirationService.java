package com.itechwx.ecommerce.jobs.application;

public interface OrderExpirationService {

    int expireBatch(int limit);
}
