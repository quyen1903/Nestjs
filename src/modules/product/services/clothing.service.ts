import { Injectable,BadRequestException } from "@nestjs/common";
import { ProductService } from "./product.service";
import { removeUndefinedObject } from "src/shared/utils";
import { CreateProductDTO } from "../dto/create-product.dto";
import { UpdateProductDTO } from "../dto/update-product.dto";
import { Clothing } from "@prisma/client";
import { Product } from "@prisma/client";
@Injectable()
export class ClothingService extends ProductService {

    async createProduct(payload: CreateProductDTO & {productShopId: string}): Promise<Product & Clothing>{
        const product = await super.createProduct(payload);

        const newClothing = await this.prismaService.clothing.create({
            data: {
                ...payload.productAttributes as Clothing,
                productId: product.id,
            }
        });

        return { ...product, ...newClothing}
    }
    async updateProduct(productId: string, payload: any): Promise< Product >  {
        const objectParams = removeUndefinedObject(payload);
        const currentProduct = await this.prismaService.clothing.findUnique({
            where:{productId}
        })
        if(!currentProduct) throw new BadRequestException('cant find updated product')

        const updatedAttributes = {
            ...currentProduct,
            ...objectParams.productAttributes
        };

        if (objectParams.productAttributes) {
            await this.prismaService.clothing.update({
                where: { productId },
                data: {
                    brand: updatedAttributes.brand,
                    size: updatedAttributes.size,
                    material: updatedAttributes.material
                }
            });
        }
        delete  objectParams.productAttributes
        return await super.updateProduct(productId, objectParams);
    }
}