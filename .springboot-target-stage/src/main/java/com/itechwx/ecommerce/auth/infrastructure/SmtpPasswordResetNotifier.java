package com.itechwx.ecommerce.auth.infrastructure;

import com.itechwx.ecommerce.auth.application.PasswordResetNotifier;
import com.itechwx.ecommerce.auth.config.PasswordResetProperties;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.util.UriComponentsBuilder;

public final class SmtpPasswordResetNotifier implements PasswordResetNotifier {

    private final JavaMailSender mailSender;
    private final PasswordResetProperties properties;

    public SmtpPasswordResetNotifier(
            JavaMailSender mailSender,
            PasswordResetProperties properties
    ) {
        this.mailSender = mailSender;
        this.properties = properties;
    }

    @Override
    public void send(String recipientEmail, String rawResetToken) {
        String resetUrl = UriComponentsBuilder.fromUriString(properties.resetBaseUrl())
                .queryParam("token", rawResetToken)
                .build()
                .encode()
                .toUriString();
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(properties.fromAddress());
        message.setTo(recipientEmail);
        message.setSubject("Reset your ecommerce password");
        message.setText("Use this link to reset your password. It expires in one hour:\n" + resetUrl);
        mailSender.send(message);
    }
}
