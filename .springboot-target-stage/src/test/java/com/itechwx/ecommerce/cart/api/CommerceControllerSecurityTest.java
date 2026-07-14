package com.itechwx.ecommerce.cart.api;

import com.itechwx.ecommerce.auth.domain.ShopPrincipal;
import com.itechwx.ecommerce.auth.domain.UserPrincipal;
import com.itechwx.ecommerce.cart.application.CartItemView;
import com.itechwx.ecommerce.cart.application.CartService;
import com.itechwx.ecommerce.discount.api.DiscountController;
import com.itechwx.ecommerce.discount.application.DiscountQuote;
import com.itechwx.ecommerce.discount.application.DiscountService;
import com.itechwx.ecommerce.inventory.api.InventoryController;
import com.itechwx.ecommerce.inventory.application.InventoryService;
import com.itechwx.ecommerce.inventory.application.InventoryView;
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
import java.util.List;
import java.util.Set;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = {CartController.class, InventoryController.class, DiscountController.class},
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
class CommerceControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CartService cartService;

    @MockitoBean
    private InventoryService inventoryService;

    @MockitoBean
    private DiscountService discountService;

    @Test
    void cartRequiresUserAndUsesVerifiedUserId() throws Exception {
        String body = "{\"product\":{\"productId\":\"sku-fixture\",\"quantity\":2}}";
        mockMvc.perform(post("/cart").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/cart").with(authentication(shopAuthentication()))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isForbidden());
        when(cartService.add("user-fixture", "sku-fixture", 2)).thenReturn(
                new CartItemView("item", "sku-fixture", "shop-fixture", 2, "Product", 1000)
        );
        mockMvc.perform(post("/cart").with(authentication(userAuthentication()))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.metadata.productId").value("sku-fixture"));
        verify(cartService).add("user-fixture", "sku-fixture", 2);
    }

    @Test
    void inventoryRequiresShopAndDiscountQuoteIgnoresClientUserAndPrice() throws Exception {
        String inventoryBody = "{\"productId\":\"sku-fixture\",\"stock\":5}";
        mockMvc.perform(post("/inventory").with(authentication(userAuthentication()))
                        .contentType(MediaType.APPLICATION_JSON).content(inventoryBody))
                .andExpect(status().isForbidden());
        when(inventoryService.addStock("shop-fixture", "sku-fixture", 5, null)).thenReturn(
                new InventoryView("inventory", "sku-fixture", "shop-fixture", "unknown", 5)
        );
        mockMvc.perform(post("/inventory").with(authentication(shopAuthentication()))
                        .contentType(MediaType.APPLICATION_JSON).content(inventoryBody))
                .andExpect(status().isOk());

        when(discountService.quoteCart(
                eq("user-fixture"), eq("shop-fixture"), eq("SAVE"), eq(List.of("sku-fixture"))
        )).thenReturn(new DiscountQuote(
                new BigDecimal("1000.00"), new BigDecimal("100.00"), new BigDecimal("900.00")
        ));
        mockMvc.perform(post("/discount/amount").with(authentication(userAuthentication()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"discountCode":"SAVE","discountUserId":"attacker-selected",
                                 "discountShopId":"shop-fixture","discountProducts":[
                                   {"productId":"sku-fixture","quantity":999,"price":0.01}]}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.metadata.totalPrice").value(900.00));
        verify(discountService).quoteCart(
                "user-fixture", "shop-fixture", "SAVE", List.of("sku-fixture")
        );
    }

    private UsernamePasswordAuthenticationToken userAuthentication() {
        return new UsernamePasswordAuthenticationToken(
                new UserPrincipal("user-fixture", "device", "user@example.test", Set.of("user:read")),
                null, List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
    }

    private UsernamePasswordAuthenticationToken shopAuthentication() {
        return new UsernamePasswordAuthenticationToken(
                new ShopPrincipal("shop-fixture", "device", "shop@example.test", Set.of("product:manage")),
                null, List.of(new SimpleGrantedAuthority("ROLE_SHOP"))
        );
    }
}
