import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "src/services/prisma/prisma.service";
import { ProductType, Sku, Spu } from "@prisma/client";
import { CreateSkuDTO, CreateSpuDTO, CreateBrandDTO } from "./dto/request-product.dto";
import { ProducerService } from "src/services/kafka/services/producer.service";
import { ItemProductDTO } from "src/modules/checkout/dto/checkout.dto";

    interface ProductWithSkus extends Spu { 
        skus: Sku[]; 
        brand: { name: string }; 
        category: { name: string }; 
    
    }

    interface ProductSearchResult { 
        id: string; 
        name: string; 
        images: string[]; 
        price?: number; 
        shopId: string; 
    }

@Injectable()
export class ProductService {
    constructor( 
        protected readonly prismaService: PrismaService,
        private readonly producerService: ProducerService
    ){}

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


    async createProduct(spu: CreateSpuDTO,  sku: CreateSkuDTO, shopId: string){
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
                data:{ ...spu, shopId }
            });
            const newSKU = await tx.sku.create({ data: {...sku} });

            return { spu: newSPU, sku: newSKU };
        })

    }

    async createBrand(body: CreateBrandDTO){

        try {
            return await this.prismaService.brand.create({
                data:{...body}
            })
        } catch (error) {
            throw new BadRequestException('Failed to create brand');
        }

    }

    async findProduct(id: string){
        return await this.prismaService.spu.findUnique({
            where:{id}
        })
    };
    async checkProductByServer(skus: ItemProductDTO[]){
        return await Promise.all(skus.map(
            async (sku)=>{
                const foundProduct = await this.prismaService.sku.findUnique({
                    where:{id: sku.productId}
                })
                if(foundProduct){
                    return{
                        price:foundProduct.price,
                        quantity:foundProduct.num,
                        productId:sku.productId
                    }
                }
            }
        ))
    }

    async updateProduct(productId: string, payload: Partial<CreateSpuDTO & CreateSkuDTO>){
        const product = await this.prismaService.spu.findUnique({ where: { id: productId }, include: { skus: true } });
        if (!product) { throw new NotFoundException('Product not found'); };

        return this.prismaService.$transaction(async(tx)=>{
            const spuFields = ['name', 'intro', 'brandId', 'categoryId', 'images', 'content', 'attributeList'];
            const spuUpdates = Object.keys(payload)
            .filter(key => spuFields.includes(key))
            .reduce((obj, key) => ({ ...obj, [key]: payload[key] }), {});

            let updatedSpu = product;
            if (Object.keys(spuUpdates).length > 0) { 
                updatedSpu = await tx.spu.update({ 
                    where: { id: productId }, 
                    data: { 
                        ...spuUpdates, 
                        updatedAt: Date.now() 
                    },
                    include:{ skus: true}
                }); 
            }

            // Update first SKU if SKU fields are provided 
            const skuFields = ['name', 'price', 'num', 'image', 'images', 'skuAttribute'];
            const skuUpdates = Object.keys(payload) 
            .filter(key => skuFields.includes(key))
            .reduce((obj, key) => ({ ...obj, [key]: payload[key] }), {});

            let updatedSku;
            if (Object.keys(skuUpdates).length > 0 && product.skus.length > 0){
                updatedSku = await tx.sku.update({ 
                    where: { id: product.skus[0].id }, 
                    data: { 
                        ...skuUpdates, 
                        updatedAt: Date.now() 
                    } 
                });
            };

            return { spu: updatedSpu, sku: updatedSku };
        })
    }

    // async findAllDraftsForShop({ productShopId, skip = 0, take = 10 }) {
    //     const query = { productShopId, isDraft: true };
    //     return await this.findAll(query, skip, take);
    // }

    // async findAllPublishForShop({ productShopId, skip = 0, take = 10 }) {
    //     const query = { productShopId, isPublished: true };
    //     return await this.findAll( query, skip, take );
    // }

    //  async publishProductByShop({ productShopId, uuid, isDraft = false, isPublished = true }) {
    //     return await this.publish( productShopId, uuid, isDraft, isPublished );
    // }

    //  async unPublishProductByShop({ productShopId, uuid, isDraft = true, isPublished = false }) {
    //     return await this.publish( productShopId, uuid, isDraft, isPublished );
    // }

    async getListSearchProduct(keySearch: string): Promise<ProductSearchResult[]> { 
        const products = await this.prismaService.spu.findMany({ 
            where: { 
                OR:[                
                    {
                        name: {search: keySearch}
                    },
                    {
                        intro: {search: keySearch}
                    },
                    {
                        content: {search: keySearch}
                    }
                ]

            }, 
            include: { 
                skus: { 
                    where: { isActive: true },
                    select: { price: true },
                    take: 1 
                } 
            }, take: 50 
        }); 
        
        return products.map(product => ({ 
            id: product.id,
            name: product.name,
            images: product.images,
            price: product.skus[0]?.price,
            shopId: product.shopId 
        })); 
    }

    //  async findAllProducts({ take = 50, skip = 0, filter = { isPublished: true } }) {
    //     return await this.findAllProduct(take, skip, filter, ['productName', 'productThumb', 'productPrice']);
    // }

    //  async findProduct(productId: string) {
    //     return await this.findUniqueProduct(productId);
    // }

}