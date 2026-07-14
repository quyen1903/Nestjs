package com.itechwx.ecommerce.auth.api;

import com.itechwx.ecommerce.auth.application.AccountIdentityResponse;
import com.itechwx.ecommerce.auth.application.AccountRegistrationService;
import com.itechwx.ecommerce.auth.application.NotificationThreadResponse;
import com.itechwx.ecommerce.auth.application.UserRegistrationResponse;
import com.itechwx.ecommerce.auth.application.AuthLoginService;
import com.itechwx.ecommerce.auth.application.AuthSessionStore;
import com.itechwx.ecommerce.auth.application.ShopLoginResponse;
import com.itechwx.ecommerce.auth.application.RefreshTokenResponse;
import com.itechwx.ecommerce.auth.application.RefreshTokenService;
import com.itechwx.ecommerce.auth.application.PasswordResetService;
import com.itechwx.ecommerce.auth.domain.ActorType;
import com.itechwx.ecommerce.auth.application.UserLoginResponse;
import com.itechwx.ecommerce.auth.domain.ShopPrincipal;
import com.itechwx.ecommerce.auth.domain.UserPrincipal;
import com.itechwx.ecommerce.shared.api.SuccessEnvelopeAdvice;
import com.itechwx.ecommerce.shared.config.EcommerceProperties;
import com.itechwx.ecommerce.shared.error.ApiErrorWriter;
import com.itechwx.ecommerce.shared.error.GlobalExceptionHandler;
import com.itechwx.ecommerce.shared.observability.RequestIdFilter;
import com.itechwx.ecommerce.shared.observability.RequestSizeLimitFilter;
import com.itechwx.ecommerce.shared.security.SecurityConfiguration;
import com.itechwx.ecommerce.customer.api.UserRegistrationController;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Set;

import static org.mockito.Mockito.verify;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = {
                UserAuthController.class,
                ShopAuthController.class,
                UserRegistrationController.class,
                GoogleOAuthUnavailableController.class
        },
        properties = {
                "ecommerce.cors.allowed-origins[0]=http://localhost:3000",
                "ecommerce.request.request-id-header=X-Request-Id",
                "ecommerce.request.max-body-bytes=2097152",
                "ecommerce.security.issuer=local-test",
                "ecommerce.security.audience=ecommerce-api",
                "ecommerce.security.token-digest-pepper=local-test-pepper-value-123456789",
                "ecommerce.security.legacy-max-token-bytes=8192",
                "ecommerce.security.clock-skew-seconds=60"
        }
)
@EnableConfigurationProperties(EcommerceProperties.class)
@Import({
        SecurityConfiguration.class,
        RequestIdFilter.class,
        RequestSizeLimitFilter.class,
        ApiErrorWriter.class,
        SuccessEnvelopeAdvice.class,
        GlobalExceptionHandler.class
})
class AuthControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuthLoginService loginService;

    @MockitoBean
    private AuthSessionStore sessionStore;

    @MockitoBean
    private RefreshTokenService refreshTokenService;

    @MockitoBean
    private PasswordResetService passwordResetService;

    @MockitoBean
    private AccountRegistrationService registrationService;

    @Test
    void publicUserAndShopLoginPreserveLiveResponseShapes() throws Exception {
        when(loginService.loginUser(
                "user@example.test", "Fixture1!", "device-user", "Browser"
        )).thenReturn(new UserLoginResponse(
                new AccountIdentityResponse("user-fixture"), "access-user", "refresh-user"
        ));
        when(loginService.loginShop(
                "shop@example.test", "Fixture1!", "device-shop", "Browser"
        )).thenReturn(new ShopLoginResponse(
                new AccountIdentityResponse("shop-fixture"), "access-shop", "refresh-shop"
        ));

        mockMvc.perform(post("/auth/user/loginManual")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"user@example.test","password":"Fixture1!",
                                 "deviceId":"device-user","deviceName":"Browser"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.metadata.user.id").value("user-fixture"))
                .andExpect(jsonPath("$.metadata.accessToken").value("access-user"));

        mockMvc.perform(post("/auth/shop/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"shop@example.test","password":"Fixture1!",
                                 "deviceId":"device-shop","deviceName":"Browser"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.metadata.shop.id").value("shop-fixture"))
                .andExpect(jsonPath("$.metadata.refreshToken").value("refresh-shop"));
    }

    @Test
    void loginValidationRejectsWeakPasswordBeforeUseCase() throws Exception {
        mockMvc.perform(post("/auth/user/loginManual")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"user@example.test","password":"letters-only"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void refreshRoutesUseLegacyHeaderAndExplicitActorType() throws Exception {
        when(refreshTokenService.refresh("refresh-user", ActorType.USER))
                .thenReturn(new RefreshTokenResponse("access-next", "refresh-next"));

        mockMvc.perform(post("/auth/user/handlerRefreshToken")
                        .header("x-rtoken-id", "refresh-user"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.metadata.accessToken").value("access-next"))
                .andExpect(jsonPath("$.metadata.refreshToken").value("refresh-next"));

        mockMvc.perform(post("/auth/shop/handlerRefreshToken"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void passwordResetRoutesPreserveGenericResponseAndValidation() throws Exception {
        when(passwordResetService.request("user@example.test"))
                .thenReturn("If your email is registered with us, you will receive a password reset link");
        when(passwordResetService.validate("reset-fixture")).thenReturn(true);

        mockMvc.perform(post("/auth/user/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"user@example.test\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.metadata.message").value(
                        "If your email is registered with us, you will receive a password reset link"
                ));

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .get("/auth/user/validate-reset-token")
                        .queryParam("token", "reset-fixture"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.metadata.valid").value(true));

        mockMvc.perform(post("/auth/user/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"reset-fixture\",\"password\":\"NextPass1!\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.metadata.message").value("Password reset successful"));
        verify(passwordResetService).reset("reset-fixture", "NextPass1!");

        mockMvc.perform(post("/auth/user/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"not-an-email\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void logoutRequiresMatchingPrincipalAndUsesVerifiedScope() throws Exception {
        UserPrincipal user = new UserPrincipal(
                "user-fixture", "device-user", "user@example.test", Set.of("user:read")
        );
        UsernamePasswordAuthenticationToken userAuthentication =
                new UsernamePasswordAuthenticationToken(
                        user,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_USER"))
                );
        when(sessionStore.revoke("user-fixture", "device-user")).thenReturn(1);

        mockMvc.perform(post("/auth/user/logout").with(authentication(userAuthentication)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.metadata.count").value(1));
        verify(sessionStore).revoke("user-fixture", "device-user");

        ShopPrincipal shop = new ShopPrincipal(
                "shop-fixture", "device-shop", "shop@example.test", Set.of()
        );
        UsernamePasswordAuthenticationToken shopAuthentication =
                new UsernamePasswordAuthenticationToken(
                        shop,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_SHOP"))
                );
        mockMvc.perform(post("/auth/user/logout").with(authentication(shopAuthentication)))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/auth/shop/logout"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void userAndShopRegistrationArePublicValidatedAndReturnMinimalAccountProjection() throws Exception {
        when(registrationService.registerUser(any())).thenReturn(new UserRegistrationResponse(
                new AccountIdentityResponse("user-new"),
                new NotificationThreadResponse("thread-new"),
                "access-new",
                "refresh-new"
        ));
        when(registrationService.registerShop(any())).thenReturn(new ShopLoginResponse(
                new AccountIdentityResponse("shop-new"),
                "access-shop-new",
                "refresh-shop-new"
        ));

        mockMvc.perform(post("/user/registerManual")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"new@example.test","password":"Fixture1!","name":"New User"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.metadata.user.id").value("user-new"))
                .andExpect(jsonPath("$.metadata.notificationThread.id").value("thread-new"))
                .andExpect(jsonPath("$.metadata.passwordHash").doesNotExist());

        mockMvc.perform(post("/auth/shop/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"shop-new@example.test","password":"Fixture1!",
                                 "name":"New Shop","businessName":"Fixture Trading",
                                 "businessType":"retail"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.metadata.shop.id").value("shop-new"))
                .andExpect(jsonPath("$.metadata.refreshToken").value("refresh-shop-new"));

        mockMvc.perform(post("/user/registerManual")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"not-email","password":"weak","name":""}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void googleRouteFailsSafelyWhenProviderConfigurationIsDisabled() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .get("/auth/auth/google"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.code").value("OAUTH_NOT_CONFIGURED"));
    }
}
