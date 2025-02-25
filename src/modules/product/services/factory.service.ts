import { Injectable, BadRequestException } from "@nestjs/common";
import { ProductService } from "./product.service";
import { PrismaService } from "src/services/prisma/prisma.service";
import { Product } from "@prisma/client";
import { getSelectData, unGetSelectData } from "src/shared/utils";
import { CreateProductDTO } from "../dto/create-product.dto";
import { UpdateProductDTO } from "../dto/update-product.dto";
import { ClothingService } from "./clothing.service";
import { ElectronicService } from "./electronic.service";
import { FurnitureService } from "./furniture.service";

interface FindAll {
    productShopId: string,  // Use UUID in Prisma/Postgres
    skip?: number,
    take?: number
}

interface Publish {
    productShopId: string;  // UUID as string
    uuid: string;    // UUID
}


@Injectable()
export class Factory{

    constructor(
        private readonly prismaService: PrismaService,
        private readonly clothingService: ClothingService,
        private readonly electronicService: ElectronicService,
        private readonly furnitureService: FurnitureService,
    ) {
        this.registerProductType('Clothing', this.clothingService);
        this.registerProductType('Electronic', this.electronicService);
        this.registerProductType('Furniture', this.furnitureService);
    }

    private productRegistry: { [key: string]: ProductService } = {};

    registerProductType(type: string, classReference: ProductService) {
        this.productRegistry[type] = classReference
    }

    async createProduct(type: CreateProductDTO['productType'], payload: CreateProductDTO & {productShopId: string}): Promise<Product> {
        const productInstance = this.productRegistry[type];
        if (!productInstance) throw new BadRequestException(`Invalid Product Type ${type}`);
        
        // Truyền payload trực tiếp vào method
        return productInstance.createProduct(payload);
    }

    async updateProduct(type: UpdateProductDTO['productType'], productId: string, payload: any): Promise<Product> {
        const productInstance = this.productRegistry[type];
        if (!productInstance) throw new BadRequestException(`Invalid Product Type ${type}`);
        return productInstance.updateProduct(productId, payload);
    }

    // Queries
    async findAllDraftsForShop({ productShopId, skip = 0, take = 10 }: FindAll) {
        const query = { productShopId, isDraft: true };
        // return await findAll(query, skip, take);
        return this.prismaService.product.findMany({
            where:{
                productShopId,
                isDraft: true
            },
            orderBy: { id: 'desc' },
            skip,
            take,
        })

    }

    async findAllPublishForShop({ productShopId, skip = 0, take = 10 }: FindAll): Promise<Product[]>{
        return this.prismaService.product.findMany({
            where:{
                productShopId,
                isPublished: true
            },
            orderBy: {id: 'desc'},
            skip,
            take,
        })
    }

    async publishProductByShop({ productShopId, uuid }: Publish): Promise<Product>{
        return this.prismaService.product.update({
            where:{
                id: uuid,
                productShopId
            },
            data:{ isDraft: false,isPublished: true}
        })
    }

    async unPublishProductByShop({ productShopId, uuid }: Publish) {
        return this.prismaService.product.update({
            where:{
                id: uuid,
                productShopId
            },
            data:{ isDraft: true,isPublished: false }
        })
    }

    async getListSearchProduct(keySearch: string) {
        //full-text search
        return await this.prismaService.product.findMany({
            where:{
                productName: { search: keySearch },
                productDescription:{ search:keySearch }
            }
        })
    }

    async findAllProducts() {
        return await this.prismaService.product.findMany({
            //sort by create decending
            where:  { isPublished: true },
            orderBy:{ createdAt: 'asc' },
            select:getSelectData(['productName', 'productThumb', 'productPrice']),
            take: 50,
            skip:0,
        })
    }

    async findProduct(id: string) {
        return this.prismaService.product.findUnique({
            where:{id},
            select:unGetSelectData(['productVariation'])
        })
    }

}

// const factory = new Factory(new PrismaService());
// const registerProduct = [
//     { type: 'Clothing', class: ClothingService },
//     { type: 'Electronic', class: ElectronicService },
//     { type: 'Furniture', class: FurnitureService }
// ];

// registerProduct.forEach((element) => {
//     factory.registerProductType(element.type, element.class);
// });