package com.itechwx.ecommerce.checkout.api;

import com.itechwx.ecommerce.auth.domain.ActorPrincipal;
import com.itechwx.ecommerce.auth.security.UserOnly;
import com.itechwx.ecommerce.checkout.application.CheckoutCommand;
import com.itechwx.ecommerce.checkout.application.CheckoutProductSelection;
import com.itechwx.ecommerce.checkout.application.CheckoutReviewView;
import com.itechwx.ecommerce.checkout.application.CheckoutService;
import com.itechwx.ecommerce.checkout.application.CheckoutShopSelection;
import com.itechwx.ecommerce.checkout.application.CreateOrdersResult;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@UserOnly
@RestController
@RequestMapping("/checkout")
public class CheckoutController {

    private final CheckoutService checkoutService;

    public CheckoutController(CheckoutService checkoutService) {
        this.checkoutService = checkoutService;
    }

    @PostMapping("/review")
    CheckoutReviewView review(
            @AuthenticationPrincipal ActorPrincipal actor,
            @Valid @RequestBody CheckoutRequest request
    ) {
        return checkoutService.review(actor.accountId(), command(request));
    }

    @PostMapping("/create_order")
    CreateOrdersResult create(
            @AuthenticationPrincipal ActorPrincipal actor,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody CheckoutRequest request
    ) {
        return checkoutService.createOrders(actor.accountId(), idempotencyKey, command(request));
    }

    private CheckoutCommand command(CheckoutRequest request) {
        return new CheckoutCommand(
                request.cartId(),
                request.shippingAddress(),
                request.shopOrderIds().stream().map(shop -> new CheckoutShopSelection(
                        shop.shopId(),
                        shop.shopDiscounts().stream().map(CheckoutDiscountRequest::codeId).toList(),
                        shop.itemProducts().stream().map(item ->
                                new CheckoutProductSelection(item.productId(), item.quantity())).toList()
                )).toList()
        );
    }
}
