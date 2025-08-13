import { Injectable, Inject, BadRequestException } from "@nestjs/common";
import { PrismaService } from "src/services/prisma/prisma.service";
import { ProductType } from "@prisma/client";
import { CreateSkuDTO, CreateSpuDTO } from "../dto/create-product.dto";
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
    // async createProduct(payload: CreateProductDTO & {productShopId: string}): Promise<Product> {
    //     const product = await this.prismaService.product.create({
    //         data: {
    //             productDescription: payload.productDescription,
    //             productName: payload.productName,
    //             productPrice: payload.productPrice,
    //             productQuantity: payload.productQuantity,
    //             productShopId: payload.productShopId,
    //             productThumb: payload.productThumb,
    //             productType: payload.productType as ProductType,
    //         }
    //     });
    //     if(product){
    //         const shop = await this.prismaService.shop.findUnique({
    //             where:{
    //                 id: product.productShopId
    //             }
    //         })
    //         await this.prismaService.inventory.create({
    //             data:{
    //                 inventoryProductId: product.id,
    //                 inventoryStock: product.productQuantity,
    //                 inventoryLocation: 'unknow',
    //             }
    //         })
    //         const topics = this.producerService.getTopics()

    //         await this.producerService.produce({
    //             topic: topics.PRODUCT_CREATED,
    //             messages:[
    //                 {
    //                     value:JSON.stringify({
    //                         productId: product.id,
    //                         productName: product.productName,
    //                         shopId: product.productShopId,
    //                         shopName: shop?.name
    //                     })
    //                 }
    //             ]
    //         })
    //     }

    //     return product 
    // }

    /**
     * A closure table is a table that stores all the paths 
     * between all elements in a hierarchical data structure.
     * The table includes two columns for the IDs of the related 
     * elements and a third column that represents the distance between them.
     * 
     */

    async createCategory(cateid: string, ){
        
    };
    
    async createProduct(spuDTO: CreateSpuDTO,  sku: CreateSkuDTO){
        const spuExisted =await this.prismaService.spu.findUnique({
            where:{
                name:spuDTO.name
            }
        })

        if(spuExisted) throw new BadRequestException(" SPU already existed")

        const newSPU = await this.prismaService.spu.create({
            data:{
                name: spuDTO.name,
                intro: spuDTO.intro,
                brandId: spuDTO.brandId,
                categoryOneId:  spuDTO.categoryOneId,
                categoryTwoId: spuDTO.categoryTwoId,
                categoryThreeId: spuDTO.categoryThreeId,
                images: spuDTO.images,
                afterSalesService: spuDTO.afterSalesService,
                content: spuDTO.content,
                attributeList: spuDTO.attributeList,
                isMarketable: spuDTO.isMarketable,
            }
        })

        const skuExisted = await this.prismaService.sku.findUnique({
            where:{
                name: newSPU.name,
                spuId: newSPU.id
            }
        })
    }

    async updateProduct(productId: string, payload: any): Promise<Product>{
        return await this.prismaService.product.update({
            where: { id: productId },
            data: payload
        });
    }
}