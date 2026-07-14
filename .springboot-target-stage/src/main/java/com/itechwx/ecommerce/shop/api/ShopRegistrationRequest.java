package com.itechwx.ecommerce.shop.api;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ShopRegistrationRequest(
        @Size(min = 3, max = 50) String username,
        @NotBlank @Email @Size(max = 320) String email,
        @NotBlank
        @Size(min = 6, max = 20)
        @Pattern(regexp = ".*[A-Za-z].*", message = "password must contain a letter")
        @Pattern(regexp = ".*[0-9].*", message = "password must contain a number")
        @Pattern(
                regexp = "[A-Za-z0-9!@#$%^&*()_+{}\\[\\]:;<>,.?~\\\\/\\-]+",
                message = "password contains unsupported characters"
        ) String password,
        @NotBlank @Size(min = 2, max = 100) String name,
        @Pattern(regexp = "^\\+?[1-9][0-9]{6,14}$", message = "phone must be in international format") String phone,
        @Size(max = 500) String address,
        @Size(max = 100) String timezone,
        @Pattern(regexp = "en|vi|fr") String language,
        @NotBlank @Size(min = 2, max = 200) String businessName,
        @NotBlank @Size(max = 100) String businessType,
        @Size(max = 50) String taxId,
        @Size(max = 500) String businessAddress,
        @Pattern(regexp = "USD|VND|EUR") String currency,
        @Pattern(regexp = "light|dark") String theme,
        Boolean emailNotifications,
        Boolean smsNotifications,
        Boolean pushNotifications
) {
}
