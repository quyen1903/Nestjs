import { Injectable } from "@nestjs/common";
import { ProductService } from './product.service';
import { removeUndefinedObject } from "src/shared/utils";
import { BadRequestException } from "@nestjs/common";
import { CreateProductDTO } from "../dto/create-product.dto";
import { Electronic } from "@prisma/client";
import { Product } from "@prisma/client";
@Injectable()
export class ElectronicService extends ProductService {

    async createProduct(payload: CreateProductDTO & {productShopId: string}): Promise< Product & Electronic>{
        const product = await super.createProduct(payload);

        const newElectronic = await this.prismaService.electronic.create({
            data: {
                ...payload.productAttributes as Electronic,
                productId: product.id,
            }
        });

        return { ...product, ...newElectronic };
    }

    async updateProduct(productId: string, payload: any) {
        const objectParams = removeUndefinedObject(payload);
        const currentProduct = await this.prismaService.electronic.findUnique({
            where:{productId}
        })
        if(!currentProduct) throw new BadRequestException('cant find updated product')

        const updatedAttributes = {
            ...currentProduct,
            ...objectParams.productAttributes
        };

        if (objectParams.productAttributes) {
            await this.prismaService.electronic.update({
                where: { productId },
                data: {
                    manufacturer: updatedAttributes.manufacturer,
                    model: updatedAttributes.model,
                    color: updatedAttributes.color,
                }
            });
        }
        delete  objectParams.productAttributes
        return await super.updateProduct(productId, objectParams);
    }
}