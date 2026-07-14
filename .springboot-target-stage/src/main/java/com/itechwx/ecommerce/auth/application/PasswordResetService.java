package com.itechwx.ecommerce.auth.application;

public interface PasswordResetService {

    String request(String email);

    void reset(String rawResetToken, String newPassword);

    boolean validate(String rawResetToken);
}
