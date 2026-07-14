package com.itechwx.ecommerce.shared.security;

import com.itechwx.ecommerce.shared.config.EcommerceProperties;
import com.itechwx.ecommerce.shared.error.ApiErrorWriter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfiguration {

    @Bean
    @Order(2)
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            ApiErrorWriter errorWriter,
            List<SecurityFilterContributor> contributors
    ) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .requestCache(cache -> cache.disable())
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .logout(logout -> logout.disable())
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(HttpMethod.GET, "/").permitAll()
                        .requestMatchers(HttpMethod.GET,
                                "/actuator/health",
                                "/actuator/health/**",
                                "/v3/api-docs",
                                "/v3/api-docs/**",
                                "/swagger-ui.html",
                                "/swagger-ui/**"
                        ).permitAll()
                        .requestMatchers(HttpMethod.GET,
                                "/auth/user/validate-reset-token",
                                "/auth/auth/google",
                                "/auth/auth/google/callback"
                        ).permitAll()
                        .requestMatchers(HttpMethod.GET,
                                "/product/search/**",
                                "/product/all",
                                "/product/productById/**",
                                "/product/productByName/**",
                                "/category",
                                "/category/**"
                        ).permitAll()
                        .requestMatchers(HttpMethod.POST,
                                "/auth/user/loginManual",
                                "/auth/shop/login",
                                "/auth/user/handlerRefreshToken",
                                "/auth/shop/handlerRefreshToken",
                                "/auth/user/forgot-password",
                                "/auth/user/reset-password",
                                "/auth/shop/register",
                                "/user/registerManual"
                        ).permitAll()
                        .requestMatchers(HttpMethod.POST, "/auth/user/logout").hasRole("USER")
                        .requestMatchers(HttpMethod.POST, "/auth/shop/logout").hasRole("SHOP")
                        .requestMatchers(HttpMethod.POST,
                                "/product/create_product",
                                "/product/create_brand",
                                "/product/publish/**",
                                "/product/unpublish/**"
                        ).hasRole("SHOP")
                        .requestMatchers(HttpMethod.PATCH, "/product/**").hasRole("SHOP")
                        .requestMatchers(HttpMethod.GET,
                                "/product/drafts/all",
                                "/product/published/all"
                        ).hasRole("SHOP")
                        .requestMatchers("/cart", "/cart/**").hasRole("USER")
                        .requestMatchers("/comment", "/comment/**").hasRole("USER")
                        .requestMatchers(HttpMethod.POST, "/inventory").hasRole("SHOP")
                        .requestMatchers(HttpMethod.POST, "/checkout/**").hasRole("USER")
                        .requestMatchers(HttpMethod.POST, "/payments/webhook").permitAll()
                        .requestMatchers(HttpMethod.POST, "/payments/refund")
                        .hasAnyRole("SHOP", "ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/payments/customers").hasRole("USER")
                        .requestMatchers(HttpMethod.POST, "/payments").hasRole("USER")
                        .requestMatchers(HttpMethod.GET, "/payments/**")
                        .hasAnyRole("USER", "SHOP", "ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/discount/list_product_code").permitAll()
                        .requestMatchers(HttpMethod.POST, "/discount/amount").hasRole("USER")
                        .requestMatchers(HttpMethod.GET, "/discount").hasRole("SHOP")
                        .requestMatchers(HttpMethod.POST, "/discount").hasRole("SHOP")
                        .requestMatchers(HttpMethod.DELETE, "/discount").hasRole("SHOP")
                        .requestMatchers(HttpMethod.POST, "/category")
                        .hasAnyRole("ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/category/**")
                        .hasAnyRole("ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/category/**")
                        .hasAnyRole("ADMIN", "SUPER_ADMIN")
                        .anyRequest().denyAll()
                )
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, exception) -> errorWriter.write(
                                request,
                                response,
                                HttpStatus.UNAUTHORIZED,
                                "UNAUTHENTICATED",
                                "Authentication is required."
                        ))
                        .accessDeniedHandler((request, response, exception) -> errorWriter.write(
                                request,
                                response,
                                HttpStatus.FORBIDDEN,
                                "FORBIDDEN",
                                "You do not have permission to perform this action."
                        ))
                )
                .headers(headers -> headers
                        .contentTypeOptions(Customizer.withDefaults())
                        .frameOptions(frame -> frame.deny())
                        .httpStrictTransportSecurity(hsts -> hsts
                                .includeSubDomains(true)
                                .maxAgeInSeconds(31_536_000))
                );

        for (SecurityFilterContributor contributor : contributors) {
            contributor.configure(http);
        }

        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(EcommerceProperties properties) {
        List<String> origins = properties.cors().allowedOrigins();
        if (origins.contains("*")) {
            throw new IllegalStateException("Wildcard CORS origins are prohibited when credentials are enabled");
        }

        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(List.of("GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of(
                "Authorization", "Content-Type", "X-Request-Id", "X-RToken-Id", "Idempotency-Key"
        ));
        configuration.setExposedHeaders(List.of(properties.request().requestIdHeader()));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
