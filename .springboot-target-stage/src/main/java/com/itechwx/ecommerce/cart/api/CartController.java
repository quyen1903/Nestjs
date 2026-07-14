package com.itechwx.ecommerce.cart.api;

import com.itechwx.ecommerce.auth.domain.ActorPrincipal;
import com.itechwx.ecommerce.auth.security.UserOnly;
import com.itechwx.ecommerce.cart.application.CartItemView;
import com.itechwx.ecommerce.cart.application.CartService;
import com.itechwx.ecommerce.cart.application.CartUpdateItem;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@UserOnly
@RestController
@RequestMapping("/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @PostMapping
    CartItemView add(
            @AuthenticationPrincipal ActorPrincipal actor,
            @Valid @RequestBody CreateCartRequest request
    ) {
        return cartService.add(actor.accountId(), request.product().productId(), request.product().quantity());
    }

    @PostMapping("/update")
    List<CartItemView> update(
            @AuthenticationPrincipal ActorPrincipal actor,
            @Valid @RequestBody UpdateCartRequest request
    ) {
        List<CartUpdateItem> items = request.shopOrderIds().stream()
                .flatMap(shop -> shop.itemProducts().stream())
                .map(item -> new CartUpdateItem(item.productId(), item.quantity()))
                .toList();
        return cartService.update(actor.accountId(), items);
    }

    @DeleteMapping
    DeleteCartItemResponse delete(
            @AuthenticationPrincipal ActorPrincipal actor,
            @Valid @RequestBody DeleteCartItemRequest request
    ) {
        return new DeleteCartItemResponse(
                true,
                cartService.delete(actor.accountId(), request.productId())
        );
    }

    @GetMapping
    List<CartItemView> list(@AuthenticationPrincipal ActorPrincipal actor) {
        return cartService.list(actor.accountId());
    }
}
