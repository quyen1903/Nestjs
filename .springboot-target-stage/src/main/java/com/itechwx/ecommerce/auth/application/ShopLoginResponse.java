package com.itechwx.ecommerce.auth.application;

public record ShopLoginResponse(
        AccountIdentityResponse shop,
        String accessToken,
        String refreshToken
) {
}
