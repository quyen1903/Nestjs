package com.itechwx.ecommerce.payment.api;

import com.itechwx.ecommerce.auth.domain.ActorPrincipal;
import com.itechwx.ecommerce.payment.application.CreatePaymentCommand;
import com.itechwx.ecommerce.payment.application.CreatePaymentResult;
import com.itechwx.ecommerce.payment.application.CustomerResult;
import com.itechwx.ecommerce.payment.application.PaymentIntentView;
import com.itechwx.ecommerce.payment.application.PaymentService;
import com.itechwx.ecommerce.payment.application.RefundPaymentCommand;
import com.itechwx.ecommerce.payment.application.RefundPaymentResult;
import com.itechwx.ecommerce.payment.application.WebhookResult;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    CreatePaymentResult createPayment(
            @AuthenticationPrincipal ActorPrincipal actor,
            @Valid @RequestBody CreatePaymentRequest request
    ) {
        return paymentService.createPayment(actor.accountId(), new CreatePaymentCommand(
                request.orderId(), request.amount(), request.currency(), request.description(),
                request.customerId(), request.metadata() == null ? Map.of() : request.metadata()
        ));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER','SHOP','ADMIN','SUPER_ADMIN')")
    PaymentIntentView getPayment(
            @AuthenticationPrincipal ActorPrincipal actor,
            @PathVariable("id") String paymentIntentId
    ) {
        return paymentService.getPayment(actor, paymentIntentId);
    }

    @PostMapping("/refund")
    @PreAuthorize("hasAnyRole('SHOP','ADMIN','SUPER_ADMIN')")
    RefundPaymentResult refund(
            @AuthenticationPrincipal ActorPrincipal actor,
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody RefundPaymentRequest request
    ) {
        return paymentService.refund(actor, idempotencyKey, new RefundPaymentCommand(
                request.paymentIntentId(), request.amount(), request.reason()
        ));
    }

    @PostMapping("/customers")
    @PreAuthorize("hasRole('USER')")
    CustomerResult createCustomer(@AuthenticationPrincipal ActorPrincipal actor) {
        return paymentService.createCustomer(actor.accountId());
    }

    @PostMapping(value = "/webhook", consumes = MediaType.APPLICATION_JSON_VALUE)
    WebhookResult webhook(
            @RequestHeader("Stripe-Signature") String signature,
            @RequestBody byte[] rawBody
    ) {
        return paymentService.handleWebhook(signature, rawBody);
    }
}
