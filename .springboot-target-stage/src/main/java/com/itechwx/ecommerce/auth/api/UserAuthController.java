package com.itechwx.ecommerce.auth.api;

import com.itechwx.ecommerce.auth.application.AuthLoginService;
import com.itechwx.ecommerce.auth.application.AuthSessionStore;
import com.itechwx.ecommerce.auth.application.LogoutResponse;
import com.itechwx.ecommerce.auth.application.UserLoginResponse;
import com.itechwx.ecommerce.auth.application.RefreshTokenResponse;
import com.itechwx.ecommerce.auth.application.RefreshTokenService;
import com.itechwx.ecommerce.auth.application.PasswordResetService;
import com.itechwx.ecommerce.auth.application.PasswordResetMessageResponse;
import com.itechwx.ecommerce.auth.application.ValidateResetTokenResponse;
import com.itechwx.ecommerce.auth.domain.ActorType;
import com.itechwx.ecommerce.auth.domain.ActorPrincipal;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth/user")
public class UserAuthController {

    private final AuthLoginService loginService;
    private final AuthSessionStore sessionStore;
    private final RefreshTokenService refreshTokenService;
    private final PasswordResetService passwordResetService;

    public UserAuthController(
            AuthLoginService loginService,
            AuthSessionStore sessionStore,
            RefreshTokenService refreshTokenService,
            PasswordResetService passwordResetService
    ) {
        this.loginService = loginService;
        this.sessionStore = sessionStore;
        this.refreshTokenService = refreshTokenService;
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/handlerRefreshToken")
    RefreshTokenResponse refresh(@RequestHeader("x-rtoken-id") String refreshToken) {
        return refreshTokenService.refresh(refreshToken, ActorType.USER);
    }

    @PostMapping("/forgot-password")
    PasswordResetMessageResponse forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request
    ) {
        return new PasswordResetMessageResponse(passwordResetService.request(request.email()));
    }

    @PostMapping("/reset-password")
    PasswordResetMessageResponse resetPassword(
            @Valid @RequestBody ResetPasswordRequest request
    ) {
        passwordResetService.reset(request.token(), request.password());
        return new PasswordResetMessageResponse("Password reset successful");
    }

    @GetMapping("/validate-reset-token")
    ValidateResetTokenResponse validateResetToken(@RequestParam("token") String token) {
        return new ValidateResetTokenResponse(passwordResetService.validate(token));
    }

    @PostMapping("/loginManual")
    UserLoginResponse login(@Valid @RequestBody LoginRequest request) {
        return loginService.loginUser(
                request.email(),
                request.password(),
                request.deviceId(),
                request.deviceName()
        );
    }

    @PostMapping("/logout")
    LogoutResponse logout(@AuthenticationPrincipal ActorPrincipal actor) {
        return new LogoutResponse(sessionStore.revoke(actor.accountId(), actor.deviceId()));
    }
}
