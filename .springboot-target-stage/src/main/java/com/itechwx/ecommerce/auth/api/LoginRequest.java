package com.itechwx.ecommerce.auth.api;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank @Email @Size(max = 320) String email,
        @NotBlank
        @Size(min = 6, max = 20)
        @Pattern(regexp = ".*[A-Za-z].*", message = "password must contain a letter")
        @Pattern(regexp = ".*[0-9].*", message = "password must contain a number")
        @Pattern(
                regexp = "[A-Za-z0-9!@#$%^&*()_+{}\\[\\]:;<>,.?~\\\\/\\-]+",
                message = "password contains unsupported characters"
        )
        String password,
        @Size(max = 200)
        @Pattern(regexp = "[^\\p{Cc}\\p{Cf}]*", message = "deviceId contains control characters")
        String deviceId,
        @Size(max = 200)
        @Pattern(regexp = "[^\\p{Cc}\\p{Cf}]*", message = "deviceName contains control characters")
        String deviceName
) {
}
