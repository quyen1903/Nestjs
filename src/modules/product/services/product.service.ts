import { Injectable, Inject, BadRequestException } from "@nestjs/common";
import { PrismaService } from "src/services/prisma/prisma.service";
import { CreateBrandDTO, CreateCategoryDTO, CreateSkuDTO, CreateSpuDTO } from "../dto/create-product.dto";
import { ProducerService } from "src/services/kafka/services/producer.service";
import { Brand, Category, Prisma } from "@prisma/client";
import { exists } from "@prisma/internals/dist/utils/tryLoadEnvs";

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
    async createCategory(name: string, parentId?: string){
        return await this.prismaService.$transaction(async (tx)=>{

            //1 create the new category
            const newCategory = await tx.category.create({
                data: { name },
            });
            // 2. Always insert self-reference
            await tx.categoryClosureTable.create({
                data:{
                    ancestorId: newCategory.id,
                    descendantId: newCategory.id,
                    depth: 0
                }
            })

            if(parentId){
                //3 get all ancestors of parent

                const ancestors = await tx.categoryClosureTable.findMany({
                    where:{ descendantId: parentId}
                });

                //4 insert new paths (ancestor -> newCategory)
                const newPaths = ancestors.map((accumulator)=>({
                    ancestorId: accumulator.ancestorId,
                    descendantId: newCategory.id,
                    depth: accumulator.depth + 1
                }));

                newPaths.push({
                    ancestorId: parentId,
                    descendantId: newCategory.id,
                    depth: 1,
                });

                await tx.categoryClosureTable.createMany({
                    data: newPaths,
                });

                return newCategory;
            }

        })
    };
    
    /**
     * create new product with sku and spu
     * 
     * @param spu standard product unit DTO
     * @param sku stock keeping unit DTO
     * @returns 
     */
    async createProduct(spu: CreateSpuDTO,  sku: CreateSkuDTO){

        // we check spu existed or not
        const spuExisted =await this.prismaService.spu.findUnique({
            where:{
                name:spu.name,
                categoryId: spu.categoryId,
                brandId: spu.brandId
            }
        });

        // 1.1 once spu existed, we use transaction
        if(spuExisted) {

            return this.prismaService.$transaction(async(tx)=>{
                const skuExists = await tx.sku.findFirst({
                    where: {
                        spuId: spuExisted.id,
                        skuAttribute: sku.skuAttribute
                    }
                });

                //1.2 once sku existed, throw error
                if (skuExists) throw new BadRequestException('SKU variant already exists for this SPU');

                //1.3 create sku
                const newSKU = await tx.sku.create({ 
                    data: {...sku}
                });

                const topics = this.producerService.getTopics()

                await this.producerService.produce({
                    topic: topics.PRODUCT_CREATED,
                    messages:[
                        {
                            value:JSON.stringify({
                                spuId: newSKU.id,
                                productName: spuExisted.name
                            })
                        }
                    ]
                })

                //return spu and sku
                return { spu: spuExisted, sku: newSKU };
            })
        }

        // 2 spu are not existed, we create new spu and sku
        return this.prismaService.$transaction(async (tx)=>{
            const newSPU = await tx.spu.create({
                data:{ 
                    ...spu,
                    brandId: spu.brandId
                }
            });
            const newSKU = await tx.sku.create({ data: {...sku} });

            return { spu: newSPU, sku: newSKU };
        })

    }

    async createBrand(body: CreateBrandDTO){
        const newBrand = await this.prismaService.brand.create({
            data:{...body}
        })

        if(!newBrand) return new BadRequestException(' something was wrong, please check your paramerter')

        return newBrand
    }

}