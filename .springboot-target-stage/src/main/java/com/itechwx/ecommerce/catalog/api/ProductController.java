package com.itechwx.ecommerce.catalog.api;

import com.itechwx.ecommerce.auth.domain.ActorPrincipal;
import com.itechwx.ecommerce.auth.security.ShopOnly;
import com.itechwx.ecommerce.catalog.application.BrandView;
import com.itechwx.ecommerce.catalog.application.CatalogService;
import com.itechwx.ecommerce.catalog.application.CreateSkuCommand;
import com.itechwx.ecommerce.catalog.application.CreateSpuCommand;
import com.itechwx.ecommerce.catalog.application.ProductMutationResponse;
import com.itechwx.ecommerce.catalog.application.ProductView;
import com.itechwx.ecommerce.catalog.application.UpdateProductCommand;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Validated
@RestController
@RequestMapping("/product")
public class ProductController {

    private final CatalogService catalogService;

    public ProductController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @ShopOnly
    @PostMapping("/create_product")
    ProductMutationResponse createProduct(
            @AuthenticationPrincipal ActorPrincipal actor,
            @Valid @RequestBody CreateProductRequest request
    ) {
        return catalogService.createProduct(
                actor.accountId(),
                new CreateSpuCommand(
                        request.spu().name(),
                        request.spu().intro(),
                        request.spu().brandId(),
                        request.spu().categoryId(),
                        request.spu().images(),
                        request.spu().afterSalesService(),
                        request.spu().content(),
                        request.spu().attributeList(),
                        request.spu().isMarketable(),
                        request.spu().status()
                ),
                new CreateSkuCommand(
                        request.sku().name(),
                        request.sku().price(),
                        request.sku().stock(),
                        request.sku().image(),
                        request.sku().images(),
                        request.sku().brandName(),
                        request.sku().attributes(),
                        request.sku().status()
                )
        );
    }

    @ShopOnly
    @PostMapping("/create_brand")
    BrandView createBrand(
            @AuthenticationPrincipal ActorPrincipal actor,
            @Valid @RequestBody CreateBrandRequest request
    ) {
        return catalogService.createBrand(
                actor.accountId(),
                request.name(),
                request.image(),
                request.initial(),
                request.sort()
        );
    }

    @ShopOnly
    @PatchMapping("/{productId}")
    ProductMutationResponse updateProduct(
            @AuthenticationPrincipal ActorPrincipal actor,
            @PathVariable @Size(max = 128) String productId,
            @Valid @RequestBody UpdateProductRequest request
    ) {
        return catalogService.updateProduct(actor.accountId(), productId, updateCommand(request));
    }

    @ShopOnly
    @PostMapping("/publish/{id}")
    ProductView publish(
            @AuthenticationPrincipal ActorPrincipal actor,
            @PathVariable @Size(max = 128) String id
    ) {
        return catalogService.publish(actor.accountId(), id, true);
    }

    @ShopOnly
    @PostMapping("/unpublish/{id}")
    ProductView unpublish(
            @AuthenticationPrincipal ActorPrincipal actor,
            @PathVariable @Size(max = 128) String id
    ) {
        return catalogService.publish(actor.accountId(), id, false);
    }

    @ShopOnly
    @GetMapping("/drafts/all")
    List<ProductView> drafts(
            @AuthenticationPrincipal ActorPrincipal actor,
            @RequestParam(defaultValue = "0") @Min(0) int skip,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int take
    ) {
        return catalogService.listForShop(actor.accountId(), false, skip, take);
    }

    @ShopOnly
    @GetMapping("/published/all")
    List<ProductView> published(
            @AuthenticationPrincipal ActorPrincipal actor,
            @RequestParam(defaultValue = "0") @Min(0) int skip,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int take
    ) {
        return catalogService.listForShop(actor.accountId(), true, skip, take);
    }

    @GetMapping("/search/{keySearch}")
    List<ProductView> search(@PathVariable @Size(min = 1, max = 200) String keySearch) {
        return catalogService.searchPublic(keySearch, 50);
    }

    @GetMapping("/all")
    List<ProductView> all(
            @RequestParam(defaultValue = "0") @Min(0) int skip,
            @RequestParam(defaultValue = "50") @Min(1) @Max(100) int take,
            @RequestParam(required = false) Boolean isPublished
    ) {
        return catalogService.listPublic(skip, take);
    }

    @GetMapping("/productById/{productId}")
    ProductView byId(@PathVariable @Size(max = 128) String productId) {
        return catalogService.findPublicById(productId);
    }

    @GetMapping("/productByName/{name}")
    List<ProductView> byName(@PathVariable @Size(min = 1, max = 200) String name) {
        return catalogService.findPublicByName(name, 10);
    }

    private UpdateProductCommand updateCommand(UpdateProductRequest request) {
        return new UpdateProductCommand(
                request.name(),
                request.intro(),
                request.brandId(),
                request.categoryId(),
                request.images(),
                request.afterSalesService(),
                request.content(),
                request.attributeList(),
                request.price(),
                request.stock(),
                request.image(),
                request.brandName(),
                request.attributes()
        );
    }
}
