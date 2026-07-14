package com.itechwx.ecommerce.auth.infrastructure;

import com.itechwx.ecommerce.auth.config.PasswordResetProperties;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class SmtpPasswordResetNotifierTest {

    @Test
    void sendsTokenOnlyToRecipientInEncodedResetUrl() {
        JavaMailSender sender = mock(JavaMailSender.class);
        SmtpPasswordResetNotifier notifier = new SmtpPasswordResetNotifier(
                sender,
                new PasswordResetProperties(
                        "no-reply@example.test",
                        "http://localhost:3000/reset-password"
                )
        );

        notifier.send("recipient@example.test", "reset token/+fixture");

        ArgumentCaptor<SimpleMailMessage> message = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(sender).send(message.capture());
        assertThat(message.getValue().getTo()).containsExactly("recipient@example.test");
        assertThat(message.getValue().getText())
                .contains("token=reset%20token/+fixture")
                .doesNotContain("recipient@example.test");
    }
}
