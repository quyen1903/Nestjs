import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/services/prisma/prisma.service";
import { ProductType } from "@prisma/client";
import { CreateProductDTO } from "../dto/create-product.dto";
import { Product } from "@prisma/client";
import { Clothing } from "@prisma/client";
import { Electronic } from "@prisma/client";
import { Furniture } from "@prisma/client";
@Injectable()
export class ProductService {
    constructor( protected readonly prismaService: PrismaService){}

    // Create main product and return its ID
    async createProduct(payload: CreateProductDTO & {productShopId: string}): Promise<Product> {
        const result = await this.prismaService.product.create({
            data: {
                productDescription: payload.productDescription,
                productName: payload.productName,
                productPrice: payload.productPrice,
                productQuantity: payload.productQuantity,
                productShopId: payload.productShopId,
                productThumb: payload.productThumb,
                productType: payload.productType as ProductType,
            }
        });
        // if(newProduct){
        //     await insertInventory({
        //         productId: newProduct.id,
        //         stock: this.productQuantity,
        //         location: "unknow"
        //     })
        // }

        return result 
    }

    async updateProduct(productId: string, payload: any): Promise<Product>{
        return await this.prismaService.product.update({
            where: { id: productId },
            data: payload
        });
    }
}