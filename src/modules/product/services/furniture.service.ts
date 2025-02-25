import { Injectable, BadRequestException } from "@nestjs/common";
import { ProductService } from "./product.service";
import { removeUndefinedObject } from "src/shared/utils";
import { CreateProductDTO } from "../dto/create-product.dto";
import { Furniture } from "@prisma/client";
import { Product } from "@prisma/client";
@Injectable()
export class FurnitureService extends ProductService {

    async createProduct(payload: CreateProductDTO & {productShopId: string}): Promise<Product & Furniture> {
        const product = await super.createProduct(payload);

        const newFurniture = await this.prismaService.furniture.create({
            data: {
                ...payload.productAttributes as Furniture,
                productId: product.id,
            }
        });

        return { ...product,...newFurniture };
    }

    async updateProduct(productId: string, payload: any): Promise< Product > {
        const objectParams = removeUndefinedObject(payload);
        const currentProduct = await this.prismaService.furniture.findUnique({
            where:{productId}
        })
        if(!currentProduct) throw new BadRequestException('cant find updated product')

        const updatedAttributes = {
            ...currentProduct,
            ...objectParams.productAttributes
        };

        if (objectParams.productAttributes) {
            await this.prismaService.furniture.update({
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