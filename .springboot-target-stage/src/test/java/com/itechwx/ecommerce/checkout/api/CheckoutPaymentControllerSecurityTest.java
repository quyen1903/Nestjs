package com.itechwx.ecommerce.checkout.api;

import com.itechwx.ecommerce.auth.domain.ShopPrincipal;
import com.itechwx.ecommerce.auth.domain.UserPrincipal;
import com.itechwx.ecommerce.auth.domain.ActorPrincipal;
import com.itechwx.ecommerce.checkout.application.CheckoutReviewView;
import com.itechwx.ecommerce.checkout.application.CheckoutService;
import com.itechwx.ecommerce.checkout.application.CheckoutTotals;
import com.itechwx.ecommerce.checkout.application.CreateOrdersResult;
import com.itechwx.ecommerce.payment.api.PaymentController;
import com.itechwx.ecommerce.payment.application.CreatePaymentResult;
import com.itechwx.ecommerce.payment.application.PaymentService;
import com.itechwx.ecommerce.payment.application.RefundPaymentResult;
import com.itechwx.ecommerce.payment.application.WebhookResult;
import com.itechwx.ecommerce.shared.api.SuccessEnvelopeAdvice;
import com.itechwx.ecommerce.shared.config.EcommerceProperties;
import com.itechwx.ecommerce.shared.error.ApiErrorWriter;
import com.itechwx.ecommerce.shared.error.GlobalExceptionHandler;
import com.itechwx.ecommerce.shared.observability.RequestIdFilter;
import com.itechwx.ecommerce.shared.observability.RequestSizeLimitFilter;
import com.itechwx.ecommerce.shared.security.SecurityConfiguration;
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

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = {CheckoutController.class, PaymentController.class},
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
@Import({SecurityConfiguration.class, RequestIdFilter.class, RequestSizeLimitFilter.class,
        ApiErrorWriter.class, SuccessEnvelopeAdvice.class, GlobalExceptionHandler.class})
class CheckoutPaymentControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CheckoutService checkoutService;

    @MockitoBean
    private PaymentService paymentService;

    @Test
    void checkoutRequiresUserAndUsesVerifiedIdentity() throws Exception {
        String body = """
                {"cartId":"cart-one","shippingAddress":"Safe address",
                 "shopOrderIds":[{"shopId":"shop-one","shopDiscounts":[],
                 "itemProducts":[{"productId":"sku-one","quantity":1,"price":0.01}]}]}
                """;
        mockMvc.perform(post("/checkout/review").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/checkout/review").with(authentication(shopAuthentication()))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isForbidden());

        when(checkoutService.review(eq("user-one"), any())).thenReturn(new CheckoutReviewView(
                List.of(), List.of(), new CheckoutTotals(
                BigDecimal.ONE, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ONE
        )));
        mockMvc.perform(post("/checkout/review").with(authentication(userAuthentication()))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.metadata.checkoutOrder.totalCheckout").value(1));
        verify(checkoutService).review(eq("user-one"), any());

        when(checkoutService.createOrders(eq("user-one"), eq("checkout-key"), any()))
                .thenReturn(new CreateOrdersResult(List.of(), 0, "Orders created successfully"));
        mockMvc.perform(post("/checkout/create_order").with(authentication(userAuthentication()))
                        .header("Idempotency-Key", "checkout-key")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk());
        verify(checkoutService).createOrders(eq("user-one"), eq("checkout-key"), any());
    }

    @Test
    void paymentScopesActorsAndWebhookReceivesExactBytes() throws Exception {
        when(paymentService.createPayment(eq("user-one"), any())).thenReturn(
                new CreatePaymentResult(true, "client-secret", "pi_one", "requires_payment_method")
        );
        mockMvc.perform(post("/payments").with(authentication(shopAuthentication()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"orderId\":\"order-one\",\"amount\":0.01}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/payments").with(authentication(userAuthentication()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"orderId\":\"order-one\",\"amount\":0.01}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.metadata.paymentIntentId").value("pi_one"));
        verify(paymentService).createPayment(eq("user-one"), any());

        when(paymentService.refund(
                eq((ActorPrincipal) shopAuthentication().getPrincipal()), eq("refund-key"), any()
        ))
                .thenReturn(new RefundPaymentResult(true, "re_one", "succeeded"));
        mockMvc.perform(post("/payments/refund").with(authentication(userAuthentication()))
                        .header("Idempotency-Key", "refund-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"paymentIntentId\":\"pi_one\"}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/payments/refund").with(authentication(shopAuthentication()))
                        .header("Idempotency-Key", "refund-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"paymentIntentId\":\"pi_one\"}"))
                .andExpect(status().isOk());

        byte[] raw = "{ \"id\" : \"evt_exact\" }".getBytes(StandardCharsets.UTF_8);
        when(paymentService.handleWebhook(
                eq("signature"), argThat(candidate -> java.util.Arrays.equals(candidate, raw))
        ))
                .thenReturn(new WebhookResult(true, false, "IGNORED"));
        mockMvc.perform(post("/payments/webhook")
                        .header("Stripe-Signature", "signature")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(raw))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.metadata.received").value(true));
        verify(paymentService).handleWebhook(
                eq("signature"), argThat(candidate -> java.util.Arrays.equals(candidate, raw))
        );
    }

    private UsernamePasswordAuthenticationToken userAuthentication() {
        return new UsernamePasswordAuthenticationToken(
                new UserPrincipal("user-one", "device", "user@example.test", Set.of()),
                null, List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
    }

    private UsernamePasswordAuthenticationToken shopAuthentication() {
        return new UsernamePasswordAuthenticationToken(
                new ShopPrincipal("shop-one", "device", "shop@example.test", Set.of()),
                null, List.of(new SimpleGrantedAuthority("ROLE_SHOP"))
        );
    }
}
