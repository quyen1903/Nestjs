package com.itechwx.ecommerce.shared.security;

import com.itechwx.ecommerce.shared.api.LegacyHomeController;
import com.itechwx.ecommerce.shared.api.SuccessEnvelopeAdvice;
import com.itechwx.ecommerce.shared.config.EcommerceProperties;
import com.itechwx.ecommerce.shared.error.ApiErrorWriter;
import com.itechwx.ecommerce.shared.error.GlobalExceptionHandler;
import com.itechwx.ecommerce.shared.observability.RequestIdFilter;
import com.itechwx.ecommerce.shared.observability.RequestSizeLimitFilter;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;

@WebMvcTest(
        controllers = {FoundationProbeController.class, LegacyHomeController.class},
        properties = {
                "ecommerce.cors.allowed-origins[0]=http://localhost:3000",
                "ecommerce.request.request-id-header=X-Request-Id",
                "ecommerce.request.max-body-bytes=1024",
                "ecommerce.security.issuer=local-test-issuer",
                "ecommerce.security.audience=ecommerce-api-test"
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
class FoundationSecurityTest {

    private final MockMvc mockMvc;

    @Autowired
    FoundationSecurityTest(MockMvc mockMvc) {
        this.mockMvc = mockMvc;
    }

    @Test
    void servesLegacyHomePageWithoutJsonEnvelope() throws Exception {
        mockMvc.perform(get("/").header("X-Request-Id", "fixture-request"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Request-Id", "fixture-request"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_HTML))
                .andExpect(content().string(containsString("Welcome to QuyenCommerce")))
                .andExpect(content().string(not(containsString("\"metadata\""))));
    }

    @Test
    void allowsOnlyExplicitPublicFoundationRoute() throws Exception {
        mockMvc.perform(get("/actuator/health").header("X-Request-Id", "fixture-request"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Request-Id", "fixture-request"))
                .andExpect(jsonPath("$.metadata.status").value("UP"));
    }

    @Test
    void unknownRouteIsDeniedWithoutAuthentication() throws Exception {
        mockMvc.perform(get("/business-probe"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"))
                .andExpect(jsonPath("$.requestId").isNotEmpty());
    }

    @Test
    @WithMockUser
    void unknownRouteRemainsDeniedForAuthenticatedPrincipal() throws Exception {
        mockMvc.perform(get("/business-probe"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void rejectsOversizedDeclaredBodyBeforeController() throws Exception {
        mockMvc.perform(get("/actuator/health")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("x".repeat(2048)))
                .andExpect(status().isPayloadTooLarge())
                .andExpect(jsonPath("$.code").value("PAYLOAD_TOO_LARGE"));
    }

    @Test
    void allowsConfiguredCorsOrigin() throws Exception {
        mockMvc.perform(options("/actuator/health")
                        .header("Origin", "http://localhost:3000")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }

    @Test
    void rejectsUnconfiguredCorsOrigin() throws Exception {
        mockMvc.perform(options("/actuator/health")
                        .header("Origin", "https://untrusted.example")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }

}
