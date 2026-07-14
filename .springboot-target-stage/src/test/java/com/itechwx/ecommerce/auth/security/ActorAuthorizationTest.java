package com.itechwx.ecommerce.auth.security;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ActorAuthorizationTest {

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void userAndShopPoliciesDenyWrongPrincipal() {
        try (AnnotationConfigApplicationContext context = context()) {
            PolicyProbe probe = context.getBean(PolicyProbe.class);

            authenticate("ROLE_USER");
            assertThatCode(probe::userOnly).doesNotThrowAnyException();
            assertThatThrownBy(probe::shopOnly).isInstanceOf(AccessDeniedException.class);

            authenticate("ROLE_SHOP");
            assertThatCode(probe::shopOnly).doesNotThrowAnyException();
            assertThatThrownBy(probe::userOnly).isInstanceOf(AccessDeniedException.class);
        }
    }

    @Test
    void permissionAndAdminPoliciesAreExplicit() {
        try (AnnotationConfigApplicationContext context = context()) {
            PolicyProbe probe = context.getBean(PolicyProbe.class);

            authenticate("ROLE_SHOP");
            assertThatThrownBy(probe::manageProducts).isInstanceOf(AccessDeniedException.class);

            authenticate("ROLE_SHOP", "PERMISSION_product:manage");
            assertThatCode(probe::manageProducts).doesNotThrowAnyException();

            authenticate("ROLE_USER");
            assertThatThrownBy(probe::adminOnly).isInstanceOf(AccessDeniedException.class);

            authenticate("ROLE_ADMIN");
            assertThatCode(probe::adminOnly).doesNotThrowAnyException();
        }
    }

    private AnnotationConfigApplicationContext context() {
        return new AnnotationConfigApplicationContext(TestConfiguration.class);
    }

    private void authenticate(String... authorities) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "fixture",
                        null,
                        List.of(authorities).stream().map(SimpleGrantedAuthority::new).toList()
                )
        );
    }

    @Configuration(proxyBeanMethods = false)
    @EnableMethodSecurity
    static class TestConfiguration {
        @Bean
        PolicyProbe policyProbe() {
            return new PolicyProbe();
        }
    }

    static class PolicyProbe {
        @UserOnly
        public void userOnly() {
        }

        @ShopOnly
        public void shopOnly() {
        }

        @PreAuthorize("hasRole('SHOP') and hasAuthority('PERMISSION_product:manage')")
        public void manageProducts() {
        }

        @AdminOnly
        public void adminOnly() {
        }
    }
}
