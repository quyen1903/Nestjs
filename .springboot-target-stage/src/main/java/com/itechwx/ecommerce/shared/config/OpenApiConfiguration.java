package com.itechwx.ecommerce.shared.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(info = @Info(
        title = "E-Commerce API",
        version = "1.0-migration",
        description = "Spring Boot parity API. Route completion is tracked in docs/migration/API_PARITY_MATRIX.md."
))
@SecurityScheme(
        name = "access",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT"
)
class OpenApiConfiguration {
}

