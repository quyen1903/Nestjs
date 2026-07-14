package com.itechwx.ecommerce.catalog.api;

import com.itechwx.ecommerce.auth.domain.AdminPrincipal;
import com.itechwx.ecommerce.auth.domain.ActorType;
import com.itechwx.ecommerce.auth.domain.ShopPrincipal;
import com.itechwx.ecommerce.auth.domain.UserPrincipal;
import com.itechwx.ecommerce.catalog.application.BrandView;
import com.itechwx.ecommerce.catalog.application.CatalogService;
import com.itechwx.ecommerce.catalog.application.CategoryService;
import com.itechwx.ecommerce.catalog.application.CategoryView;
import com.itechwx.ecommerce.catalog.application.ProductMutationResponse;
import com.itechwx.ecommerce.catalog.application.ProductView;
import com.itechwx.ecommerce.catalog.application.SkuView;
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

import java.util.List;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = {ProductController.class, CategoryController.class},
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
class CatalogControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CatalogService catalogService;

    @MockitoBean
    private CategoryService categoryService;

    @Test
    void publicCatalogReadsAreExplicitlyAllowed() throws Exception {
        when(catalogService.listPublic(0, 50)).thenReturn(List.of(product()));

        mockMvc.perform(get("/product/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.metadata[0].id").value("product-fixture"))
                .andExpect(jsonPath("$.metadata[0].skus[0].price").value(129900));
    }

    @Test
    void productMutationRequiresShopAndUsesVerifiedShopId() throws Exception {
        mockMvc.perform(post("/product/create_product")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(productRequest()))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/product/create_product")
                        .with(authentication(userAuthentication()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(productRequest()))
                .andExpect(status().isForbidden());

        when(catalogService.createProduct(eq("shop-fixture"), any(), any()))
                .thenReturn(new ProductMutationResponse(product(), product().skus().getFirst()));
        mockMvc.perform(post("/product/create_product")
                        .with(authentication(shopAuthentication()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(productRequest()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.metadata.spu.id").value("product-fixture"));

        verify(catalogService).createProduct(eq("shop-fixture"), any(), any());
    }

    @Test
    void categoryReadsArePublicButMutationRequiresAdmin() throws Exception {
        when(categoryService.findAll()).thenReturn(List.of(new CategoryView("category-fixture", "Phones", 1)));
        mockMvc.perform(get("/category"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.metadata[0].name").value("Phones"));

        mockMvc.perform(post("/category")
                        .with(authentication(shopAuthentication()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Phones\"}"))
                .andExpect(status().isForbidden());

        when(categoryService.create("Phones", 1, null))
                .thenReturn(new CategoryView("category-new", "Phones", 1));
        mockMvc.perform(post("/category")
                        .with(authentication(adminAuthentication()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Phones\",\"sort\":1}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.metadata.id").value("category-new"));
    }

    private ProductView product() {
        return new ProductView(
                "product-fixture",
                "Phone",
                "Fixture phone",
                "brand-fixture",
                "category-fixture",
                List.of("https://example.test/phone.png"),
                null,
                null,
                null,
                true,
                1,
                "shop-fixture",
                1,
                1,
                new BrandView("brand-fixture", "Fixture", "", "F", 1),
                new CategoryView("category-fixture", "Phones", 1),
                List.of(new SkuView(
                        "sku-fixture",
                        "Phone Red",
                        129900,
                        10,
                        null,
                        List.of(),
                        "Fixture",
                        "red",
                        1
                ))
        );
    }

    private String productRequest() {
        return """
                {"spu":{"name":"Phone","brandId":"brand-fixture","categoryId":"category-fixture"},
                 "sku":{"name":"Phone Red","price":129900,"stock":10,"attributes":"red"}}
                """;
    }

    private UsernamePasswordAuthenticationToken shopAuthentication() {
        ShopPrincipal principal = new ShopPrincipal(
                "shop-fixture", "device-shop", "shop@example.test", Set.of("product:manage")
        );
        return new UsernamePasswordAuthenticationToken(
                principal,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_SHOP"))
        );
    }

    private UsernamePasswordAuthenticationToken userAuthentication() {
        UserPrincipal principal = new UserPrincipal(
                "user-fixture", "device-user", "user@example.test", Set.of("user:read")
        );
        return new UsernamePasswordAuthenticationToken(
                principal,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
    }

    private UsernamePasswordAuthenticationToken adminAuthentication() {
        AdminPrincipal principal = new AdminPrincipal(
                "admin-fixture",
                "device-admin",
                "admin@example.test",
                ActorType.ADMIN,
                Set.of("catalog:manage")
        );
        return new UsernamePasswordAuthenticationToken(
                principal,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
    }
}
