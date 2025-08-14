import { Injectable, Inject, BadRequestException } from "@nestjs/common";
import { PrismaService } from "src/services/prisma/prisma.service";
import { ProductType } from "@prisma/client";
import { CreateSkuDTO, CreateSpuDTO } from "../dto/create-product.dto";
import { ProducerService } from "src/services/kafka/services/producer.service";
import { Brand, Category } from "@prisma/client";

@Injectable()
export class ProductService {
    constructor( 
        protected readonly prismaService: PrismaService,
        private readonly producerService: ProducerService
    ){}

    private skuType(sku: CreateSkuDTO, brand: Brand, category: Category, spuId: string) {
        return {
            name: sku.name,
            brandId: brand.id,
            images: sku.images,
            status: sku.status,
            price: sku.price,
            num: sku.num,
            image: sku.image,
            categoryName: category.name,
            brandName: brand.name,
            skuAttribute: sku.skuAttribute,
            inventoryId: sku.inventoryId,
            spuId,
            categoryId: category.id
        };
    }


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

    async createCategory(categoryId: string, ){
        
    };
    
    async createProduct(spuDTO: CreateSpuDTO,  sku: CreateSkuDTO){
        const spuExisted =await this.prismaService.spu.findUnique({
            where:{
                name:spuDTO.name,
                categoryId: spuDTO.categoryId,
                brandId: spuDTO.brandId
            }
        });

        const brand = await this.prismaService.brand.findUnique({ where: { id: sku.brandId } });
        const category = await this.prismaService.category.findUnique({ where: { id: spuDTO.categoryId } });

        if(spuExisted) {

            return this.prismaService.$transaction(async(tx)=>{
                const skuExists = await tx.sku.findFirst({
                    where: {
                        spuId: spuExisted.id,
                        skuAttribute: sku.skuAttribute
                    }
                });

                if (skuExists) throw new BadRequestException('SKU variant already exists for this SPU');

                const skuData = this.skuType(sku, brand, category, spuExisted.id);
                const newSKU = await tx.sku.create({ data: skuData });


                return { spu: spuExisted, sku: newSKU };
            })
        }

        return this.prismaService.$transaction(async (tx)=>{
            const newSPU = await tx.spu.create({
                data:{
                    name: spuDTO.name,
                    intro: spuDTO.intro,
                    brandId: spuDTO.brandId,
                    categoryId: spuDTO.categoryId,
                    images: spuDTO.images,
                    afterSalesService: spuDTO.afterSalesService,
                    content: spuDTO.content,
                    attributeList: spuDTO.attributeList,
                    isMarketable: spuDTO.isMarketable,
                }
            })

            const skuData = this.skuType(sku, brand, category, spuExisted.id);
            const newSKU = await tx.sku.create({ data: skuData });

            return { spu: newSPU, sku: newSKU };
        })

    }

    // async updateProduct(productId: string, payload: any): Promise<Product>{
    //     return await this.prismaService.product.update({
    //         where: { id: productId },
    //         data: payload
    //     });
    // }
}