export interface ProductSearchResult {
    id: string;
    name: string;
    images: string[];
    price?: number;
    shopId: string;
}

export interface ProductWithSkus {
    id: string;
    name: string;
    intro?: string;
    brandId: string;
    categoryId: string;
    images: string[];
    afterSalesService?: string;
    content?: string;
    attributeList?: string;
    isMarketable: boolean;
    status: number;
    shopId: string;
    isActive: boolean;
    createdAt: bigint;
    updatedAt: bigint;
    skus: Array<{
        id: string;
        name: string;
        price: number;
        num?: number;
        image?: string;
        images: string[];
        spuId: string;
        brandName?: string;
        skuAttribute?: string;
        status?: number;
        inventoryId?: string;
        isActive: boolean;
        createdAt: bigint;
        updatedAt: bigint;
    }>;
    brand: { name: string };
    category: { name: string };
}
