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

    //getter
    get findAllProductMethod() {
        return this.findAllProduct.bind(this);
    }

    private async findAll(where: any, skip:number, take:number): Promise<Product[]>{
        return await this.prismaService.product.findMany({
            where,
            orderBy: {
                id: 'desc',
            },
            skip,
            take,
        })
    }
    
    private async publish (productShopId: string, id: string, isDraft: boolean, isPublished:boolean): Promise<Product>{
        return await this.prismaService.product.update({
            where:{
                id,
                productShopId
            },
            data:{
                isDraft,
                isPublished
            }
        })
    }
    
    //full text search
    private async searchProductByUser(keySearch: string): Promise<Product[]>{
        return await this.prismaService.product.findMany({
            where:{
                productName: {
                    search: keySearch
                },
                productDescription:{
                    search:keySearch
                }
            }
        })
    }
    
    private async findAllProduct(take: number, skip: number, filter: object, select: string[]): Promise<{}>{
        return await this.prismaService.product.findMany({
            //sort by create decending
            where: filter,
            orderBy:{
                createdAt: 'asc'
            },
            select:getSelectData(select),
            take,
            skip,
        })
    }
    
    private async findUniqueProduct(id: string, unSelect: string[]): Promise<{} | null>{
        return await this.prismaService.product.findUnique({
            where:{id},
            select:unGetSelectData(unSelect)
        })
    }
    
    // private async getProductById (productId: string){
    //     return await this.prismaService.product.findUnique({
    //         where: {
    //             id:productId
    //         }
    //     })
    // }

    private productRegistry: { [key: string]: ProductService } = {};

    registerProductType(type: string, classReference: ProductService) {
        this.productRegistry[type] = classReference
    }

    async createProduct(type: CreateProductDTO['productType'], payload: CreateProductDTO & {productShopId: string}): Promise<Product> {
        const productInstance = this.productRegistry[type];
        if (!productInstance) throw new BadRequestException(`Invalid Product Type ${type}`);
        return productInstance.createProduct(payload);
    }

    async updateProduct(type: UpdateProductDTO['productType'], productId: string, payload: any): Promise<Product> {
        const productInstance = this.productRegistry[type];
        if (!productInstance) throw new BadRequestException(`Invalid Product Type ${type}`);
        return productInstance.updateProduct(productId, payload);
    }

    // Queries
    async findAllDraftsForShop({ productShopId, skip = 0, take = 10 }) {
        const query = { productShopId, isDraft: true };
        return await this.findAll(query, skip, take);
    }

    async findAllPublishForShop({ productShopId, skip = 0, take = 10 }) {
        const query = { productShopId, isPublished: true };
        return await this.findAll( query, skip, take );
    }

     async publishProductByShop({ productShopId, uuid, isDraft = false, isPublished = true }) {
        return await this.publish( productShopId, uuid, isDraft, isPublished );
    }

     async unPublishProductByShop({ productShopId, uuid, isDraft = true, isPublished = false }) {
        return await this.publish( productShopId, uuid, isDraft, isPublished );
    }

     async getListSearchProduct(keySearch: string) {
        return this.searchProductByUser(keySearch);
    }

     async findAllProducts({ take = 50, skip = 0, filter = { isPublished: true } }) {
        return await this.findAllProduct(take, skip, filter, ['productName', 'productThumb', 'productPrice']);
    }

     async findProduct(productId: string) {
        return await this.findUniqueProduct(productId, ['productVariation']);
    }

}