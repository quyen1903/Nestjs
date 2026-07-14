package com.itechwx.ecommerce.payment.infrastructure;

import com.stripe.Stripe;
import com.stripe.net.Webhook;
import com.itechwx.ecommerce.payment.config.StripeProperties;
import com.itechwx.ecommerce.shared.error.ApplicationException;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class StripePaymentGatewayTest {

    private static final String SECRET = "whsec_phase5_test_secret";

    @Test
    void verifiesTheExactRawWebhookBodyBeforeDeserialization() throws Exception {
        String payload = """
                {"id":"evt_phase5","object":"event","api_version":"%s","created":1,
                 "type":"payment_intent.succeeded","data":{"object":{
                 "id":"pi_phase5","object":"payment_intent","amount":1250,
                 "amount_received":1250,"currency":"usd","status":"succeeded"}}}
                """.formatted(Stripe.API_VERSION).trim();
        long timestamp = Webhook.Util.getTimeNow();
        String signature = Webhook.Util.computeHmacSha256(
                SECRET, timestamp + "." + payload
        );
        String header = "t=" + timestamp + ",v1=" + signature;
        StripePaymentGateway gateway = new StripePaymentGateway(new StripeProperties(
                true, "sk_test_phase5", SECRET, "usd"
        ));

        var event = gateway.verifyWebhook(header, payload.getBytes(StandardCharsets.UTF_8));
        assertThat(event.eventId()).isEqualTo("evt_phase5");
        assertThat(event.paymentIntentId()).isEqualTo("pi_phase5");
        assertThat(event.amountReceived()).isEqualTo(1250);

        assertThatThrownBy(() -> gateway.verifyWebhook(
                header, (payload + " ").getBytes(StandardCharsets.UTF_8)
        )).isInstanceOf(ApplicationException.class)
                .hasMessage("The webhook signature is invalid.");
    }
}
