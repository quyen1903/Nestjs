package com.itechwx.ecommerce.auth.application;

public interface GoogleOAuthLoginService {

    UserLoginResponse login(
            String providerId,
            String email,
            String displayName,
            String avatar,
            boolean emailVerified
    );
}
