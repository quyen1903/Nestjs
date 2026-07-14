package com.itechwx.ecommerce.auth.application;

import com.itechwx.ecommerce.auth.domain.ActorType;

public interface RefreshTokenService {

    RefreshTokenResponse refresh(String rawRefreshToken, ActorType expectedActorType);
}
