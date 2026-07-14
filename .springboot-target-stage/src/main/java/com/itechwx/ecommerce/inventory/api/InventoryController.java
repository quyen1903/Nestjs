package com.itechwx.ecommerce.inventory.api;

import com.itechwx.ecommerce.auth.domain.ActorPrincipal;
import com.itechwx.ecommerce.auth.security.ShopOnly;
import com.itechwx.ecommerce.inventory.application.InventoryService;
import com.itechwx.ecommerce.inventory.application.InventoryView;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@ShopOnly
@RestController
@RequestMapping("/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @PostMapping
    InventoryView add(
            @AuthenticationPrincipal ActorPrincipal actor,
            @Valid @RequestBody InventoryRequest request
    ) {
        return inventoryService.addStock(
                actor.accountId(), request.productId(), request.stock(), request.location()
        );
    }
}
