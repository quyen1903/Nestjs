package com.itechwx.ecommerce.auth.api;

import com.itechwx.ecommerce.auth.application.AuthLoginService;
import com.itechwx.ecommerce.auth.application.AuthSessionStore;
import com.itechwx.ecommerce.auth.application.LogoutResponse;
import com.itechwx.ecommerce.auth.application.ShopLoginResponse;
import com.itechwx.ecommerce.auth.application.RefreshTokenResponse;
import com.itechwx.ecommerce.auth.application.RefreshTokenService;
import com.itechwx.ecommerce.auth.application.AccountRegistrationService;
import com.itechwx.ecommerce.auth.application.ShopRegistrationCommand;
import com.itechwx.ecommerce.auth.domain.ActorType;
import com.itechwx.ecommerce.auth.domain.ActorPrincipal;
import com.itechwx.ecommerce.shop.api.ShopRegistrationRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth/shop")
public class ShopAuthController {

    private final AuthLoginService loginService;
    private final AuthSessionStore sessionStore;
    private final RefreshTokenService refreshTokenService;
    private final AccountRegistrationService registrationService;

    public ShopAuthController(
            AuthLoginService loginService,
            AuthSessionStore sessionStore,
            RefreshTokenService refreshTokenService,
            AccountRegistrationService registrationService
    ) {
        this.loginService = loginService;
        this.sessionStore = sessionStore;
        this.refreshTokenService = refreshTokenService;
        this.registrationService = registrationService;
    }

    @PostMapping("/handlerRefreshToken")
    RefreshTokenResponse refresh(@RequestHeader("x-rtoken-id") String refreshToken) {
        return refreshTokenService.refresh(refreshToken, ActorType.SHOP);
    }

    @PostMapping("/login")
    ShopLoginResponse login(@Valid @RequestBody LoginRequest request) {
        return loginService.loginShop(
                request.email(),
                request.password(),
                request.deviceId(),
                request.deviceName()
        );
    }

    @PostMapping("/register")
    ShopLoginResponse register(@Valid @RequestBody ShopRegistrationRequest request) {
        return registrationService.registerShop(new ShopRegistrationCommand(
                request.username(),
                request.email(),
                request.password(),
                request.name(),
                request.phone(),
                request.address(),
                request.timezone(),
                request.language(),
                request.businessName(),
                request.businessType(),
                request.taxId(),
                request.businessAddress(),
                request.currency(),
                request.theme(),
                request.emailNotifications() == null || request.emailNotifications(),
                Boolean.TRUE.equals(request.smsNotifications()),
                request.pushNotifications() == null || request.pushNotifications()
        ));
    }

    @PostMapping("/logout")
    LogoutResponse logout(@AuthenticationPrincipal ActorPrincipal actor) {
        return new LogoutResponse(sessionStore.revoke(actor.accountId(), actor.deviceId()));
    }
}
