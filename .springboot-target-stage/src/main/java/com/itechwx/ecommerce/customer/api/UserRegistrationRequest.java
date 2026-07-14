package com.itechwx.ecommerce.customer.api;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record UserRegistrationRequest(
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
        @NotBlank @Size(max = 100) String name,
        @Size(max = 500) String avatar,
        @Pattern(regexp = "^\\+?[1-9][0-9]{6,14}$", message = "phone must be in international format") String phone,
        @Size(max = 500) String address,
        @Size(max = 100) String timezone,
        @Pattern(regexp = "en|vi|th|id") String language,
        @PastOrPresent LocalDate dateOfBirth,
        @Pattern(regexp = "MALE|FEMALE") String sex,
        @Pattern(regexp = "USD|VND|THB|IDR") String currency,
        @Pattern(regexp = "light|dark") String theme,
        @Pattern(regexp = "public|private|friends") String profileVisibility,
        Boolean emailNotifications,
        Boolean smsNotifications,
        Boolean pushNotifications,
        Boolean dataSharing,
        @Size(max = 200) String deviceName
) {
}
