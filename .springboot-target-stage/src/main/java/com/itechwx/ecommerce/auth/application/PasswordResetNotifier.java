package com.itechwx.ecommerce.auth.application;

public interface PasswordResetNotifier {

    void send(String recipientEmail, String rawResetToken);
}
