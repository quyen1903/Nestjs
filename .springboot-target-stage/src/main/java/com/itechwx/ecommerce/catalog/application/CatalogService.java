package com.itechwx.ecommerce.catalog.application;

import java.util.List;

public interface CatalogService {

    ProductMutationResponse createProduct(
            String shopId,
            CreateSpuCommand spu,
            CreateSkuCommand sku
    );

    BrandView createBrand(String shopId, String name, String image, String initial, Integer sort);

    ProductMutationResponse updateProduct(String shopId, String productId, UpdateProductCommand command);

    ProductView publish(String shopId, String productId, boolean published);

    List<ProductView> listForShop(String shopId, boolean published, int skip, int take);

    List<ProductView> listPublic(int skip, int take);

    List<ProductView> searchPublic(String keyword, int take);

    ProductView findPublicById(String productId);

    List<ProductView> findPublicByName(String keyword, int take);
}
