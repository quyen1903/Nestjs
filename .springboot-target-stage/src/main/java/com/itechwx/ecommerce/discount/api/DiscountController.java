package com.itechwx.ecommerce.discount.api;

import com.itechwx.ecommerce.auth.domain.ActorPrincipal;
import com.itechwx.ecommerce.auth.security.ShopOnly;
import com.itechwx.ecommerce.auth.security.UserOnly;
import com.itechwx.ecommerce.discount.application.CreateDiscountCommand;
import com.itechwx.ecommerce.discount.application.DiscountProductView;
import com.itechwx.ecommerce.discount.application.DiscountQuote;
import com.itechwx.ecommerce.discount.application.DiscountService;
import com.itechwx.ecommerce.discount.application.DiscountView;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Validated
@RestController
@RequestMapping("/discount")
public class DiscountController {

    private final DiscountService discountService;

    public DiscountController(DiscountService discountService) {
        this.discountService = discountService;
    }

    @ShopOnly
    @PostMapping
    DiscountView create(
            @AuthenticationPrincipal ActorPrincipal actor,
            @Valid @RequestBody CreateDiscountRequest request
    ) {
        return discountService.create(actor.accountId(), new CreateDiscountCommand(
                request.discountName(), request.discountDescription(), request.discountType(),
                request.discountValue(), request.discountCode(), request.discountStartDates(),
                request.discountEndDates(), request.discountMaxUses(), request.discountMaxUsesPerUser(),
                request.discountMinOrderValue(), request.discountAppliesTo(), request.discountProductIds()
        ));
    }

    @GetMapping("/list_product_code")
    List<DiscountProductView> eligibleProducts(
            @RequestParam @Size(max = 128) String shopId,
            @RequestParam @Size(max = 100) String code,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Integer page
    ) {
        return discountService.listEligibleProducts(shopId, code);
    }

    @ShopOnly
    @GetMapping
    List<DiscountView> list(
            @AuthenticationPrincipal ActorPrincipal actor,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int limit,
            @RequestParam(defaultValue = "1") @Min(1) int page
    ) {
        return discountService.listForShop(actor.accountId(), page, limit);
    }

    @UserOnly
    @PostMapping("/amount")
    DiscountQuote amount(
            @AuthenticationPrincipal ActorPrincipal actor,
            @Valid @RequestBody DiscountAmountRequest request
    ) {
        return discountService.quoteCart(
                actor.accountId(), request.discountShopId(), request.discountCode(),
                request.discountProducts().stream().map(DiscountAmountProductRequest::productId).toList()
        );
    }

    @ShopOnly
    @DeleteMapping
    DeleteDiscountResponse delete(
            @AuthenticationPrincipal ActorPrincipal actor,
            @Valid @RequestBody DeleteDiscountRequest request
    ) {
        discountService.delete(actor.accountId(), request.discountCode());
        return new DeleteDiscountResponse(true);
    }
}
