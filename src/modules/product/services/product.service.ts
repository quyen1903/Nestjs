import { Injectable, Inject } from "@nestjs/common";
import { PrismaService } from "src/services/prisma/prisma.service";
import { ProductType } from "@prisma/client";
import { CreateProductDTO } from "../dto/create-product.dto";
import { Product } from "@prisma/client";
import { ProducerService } from "src/services/kafka/services/producer.service";

@Injectable()
export class ProductService {
    constructor( 
        protected readonly prismaService: PrismaService,
        private readonly producerService: ProducerService
    ){}

    // Create main product and return its ID
    /**
     * 
     * create product is producer, it publish event to Kafka
    */
    async createProduct(payload: CreateProductDTO & {productShopId: string}): Promise<Product> {
        const product = await this.prismaService.product.create({
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
        if(product){
            const shop = await this.prismaService.shop.findUnique({
                where:{
                    id: product.productShopId
                }
            })
            await this.prismaService.inventory.create({
                data:{
                    inventoryProductId: product.id,
                    inventoryStock: product.productQuantity,
                    inventoryLocation: 'unknow',
                }
            })
            const topics = this.producerService.getTopics()

            await this.producerService.produce({
                topic: topics.PRODUCT_CREATED,
                messages:[
                    {
                        value:JSON.stringify({
                            productId: product.id,
                            productName: product.productName,
                            shopId: product.productShopId,
                            shopName: shop?.name
                        })
                    }
                ]
            })
        }

        return product 
    }

    async updateProduct(productId: string, payload: any): Promise<Product>{
        return await this.prismaService.product.update({
            where: { id: productId },
            data: payload
        });
    }
}