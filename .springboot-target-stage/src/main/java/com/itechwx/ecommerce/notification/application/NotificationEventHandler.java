package com.itechwx.ecommerce.notification.application;

public interface NotificationEventHandler {

    NotificationProcessingResult handle(String eventId, String topic, String rawPayload);
}
