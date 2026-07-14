package com.itechwx.ecommerce.auth.application;

public record ShopRegistrationCommand(
        String username,
        String email,
        String password,
        String name,
        String phone,
        String address,
        String timezone,
        String language,
        String businessName,
        String businessType,
        String taxId,
        String businessAddress,
        String currency,
        String theme,
        boolean emailNotifications,
        boolean smsNotifications,
        boolean pushNotifications
) {
}
