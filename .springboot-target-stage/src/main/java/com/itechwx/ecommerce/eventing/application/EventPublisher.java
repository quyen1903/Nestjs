package com.itechwx.ecommerce.eventing.application;

public interface EventPublisher {

    void publish(String topic, String key, String payload);
}
