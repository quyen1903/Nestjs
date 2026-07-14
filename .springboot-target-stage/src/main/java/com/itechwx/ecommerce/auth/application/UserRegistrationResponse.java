package com.itechwx.ecommerce.auth.application;

public record UserRegistrationResponse(
        AccountIdentityResponse user,
        NotificationThreadResponse notificationThread,
        String accessToken,
        String refreshToken
) {
}
