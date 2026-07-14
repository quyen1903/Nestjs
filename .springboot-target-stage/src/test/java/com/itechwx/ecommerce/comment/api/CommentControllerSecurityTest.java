package com.itechwx.ecommerce.comment.api;

import com.itechwx.ecommerce.auth.domain.ShopPrincipal;
import com.itechwx.ecommerce.auth.domain.UserPrincipal;
import com.itechwx.ecommerce.comment.application.CommentAuthorView;
import com.itechwx.ecommerce.comment.application.CommentService;
import com.itechwx.ecommerce.comment.application.CommentView;
import com.itechwx.ecommerce.comment.application.DeleteCommentResult;
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

import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = CommentController.class,
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
class CommentControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CommentService commentService;

    @Test
    void commentsRequireUsersAndDeriveAuthorFromPrincipal() throws Exception {
        String body = """
                {"commentProductId":"product-one","commentUserId":"forged-user",
                 "commentContent":"Safe plain text"}
                """;
        mockMvc.perform(post("/comment").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/comment").with(authentication(shopAuthentication()))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isForbidden());

        when(commentService.create(eq("user-one"), argThat(command ->
                command.productId().equals("product-one") && command.content().equals("Safe plain text")
        ))).thenReturn(comment("comment-one"));
        mockMvc.perform(post("/comment").with(authentication(userAuthentication()))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.metadata.author.id").value("user-one"));
        verify(commentService).create(eq("user-one"), argThat(command ->
                command.productId().equals("product-one") && command.parentId() == null
        ));
    }

    @Test
    void commentReadsAndDeletesRemainUserScoped() throws Exception {
        mockMvc.perform(get("/comment").queryParam("commentProductId", "product-one"))
                .andExpect(status().isUnauthorized());
        when(commentService.find("product-one", null)).thenReturn(List.of(comment("comment-one")));
        mockMvc.perform(get("/comment").with(authentication(userAuthentication()))
                        .queryParam("commentProductId", "product-one"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.metadata[0].id").value("comment-one"));

        when(commentService.delete("user-one", "product-one", "comment-one"))
                .thenReturn(new DeleteCommentResult(
                        "comment-one", 0, "Comment soft deleted successfully"
                ));
        mockMvc.perform(delete("/comment").with(authentication(userAuthentication()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"id\":\"comment-one\",\"commentProductId\":\"product-one\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.metadata.deletedComment").value("comment-one"));
        verify(commentService).delete("user-one", "product-one", "comment-one");
    }

    private CommentView comment(String id) {
        return new CommentView(
                id, "Safe plain text", new CommentAuthorView("user-one", "User", null),
                1, 1, 0, 0, 0, false, null, false, "PUBLISHED", 0
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
