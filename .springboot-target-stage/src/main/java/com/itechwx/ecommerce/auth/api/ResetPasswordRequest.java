package com.itechwx.ecommerce.auth.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank @Size(max = 512) String token,
        @NotBlank
        @Size(min = 6, max = 20)
        @Pattern(regexp = ".*[A-Za-z].*", message = "password must contain a letter")
        @Pattern(regexp = ".*[0-9].*", message = "password must contain a number")
        @Pattern(
                regexp = "[A-Za-z0-9!@#$%^&*()_+{}\\[\\]:;<>,.?~\\\\/\\-]+",
                message = "password contains unsupported characters"
        )
        String password
) {
}
