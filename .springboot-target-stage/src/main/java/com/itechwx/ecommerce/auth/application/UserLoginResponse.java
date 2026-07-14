package com.itechwx.ecommerce.auth.application;

public record UserLoginResponse(
        AccountIdentityResponse user,
        String accessToken,
        String refreshToken
) {
}
