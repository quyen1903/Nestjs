package com.itechwx.ecommerce.auth.config;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "ecommerce.password-reset")
public record PasswordResetProperties(
        @NotBlank @Email String fromAddress,
        @NotBlank String resetBaseUrl
) {
}
