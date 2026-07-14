package com.itechwx.ecommerce.auth.application;

import java.time.LocalDate;

public record UserRegistrationCommand(
        String username,
        String email,
        String password,
        String name,
        String avatar,
        String phone,
        String address,
        String timezone,
        String language,
        LocalDate dateOfBirth,
        String sex,
        String currency,
        String theme,
        String profileVisibility,
        boolean emailNotifications,
        boolean smsNotifications,
        boolean pushNotifications,
        boolean dataSharing,
        String deviceName
) {
}
