package com.itechwx.ecommerce.shared.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Validated
@ConfigurationProperties(prefix = "ecommerce")
public record EcommerceProperties(
        @Valid Cors cors,
        @Valid Request request,
        @Valid Security security
) {
    public record Cors(
            @NotEmpty List<@NotBlank String> allowedOrigins
    ) {
        public Cors {
            allowedOrigins = List.copyOf(allowedOrigins);
        }
    }

    public record Request(
            @NotBlank String requestIdHeader,
            @Min(1024) long maxBodyBytes
    ) {
    }

    public record Security(
            @NotBlank String issuer,
            @NotBlank String audience,
            @NotBlank @Size(min = 32, max = 512) String tokenDigestPepper,
            @Min(1024) @Max(32768) int legacyMaxTokenBytes,
            @Min(0) @Max(300) long clockSkewSeconds
    ) {
    }
}
