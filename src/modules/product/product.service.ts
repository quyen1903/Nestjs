import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "src/services/prisma/prisma.service";
import { ProductType, Sku, Spu } from "@prisma/client";
import { CreateSkuDTO, CreateSpuDTO, CreateBrandDTO } from "./dto/request-product.dto";
import { ProducerService } from "src/services/kafka/services/producer.service";
import { ItemProductDTO } from "src/modules/checkout/dto/checkout.dto";
import { ProductSearchResult, ProductWithSkus } from "./interfaces/product.interface";

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

    async getListSearchProduct(keySearch: string): Promise<ProductSearchResult[]> {
        const products = await this.prismaService.spu.findMany({
            where: {
                AND: [
                    { isActive: true },
                    { status: 1 }, // Only published products
                    { isMarketable: true },
                    {
                        OR: [
                            { name: { search: keySearch } },
                            { intro: { search: keySearch } },
                            { content: { search: keySearch } }
                        ]
                    }
                ]
            },
            include: {
                skus: {
                    where: { isActive: true },
                    select: { price: true },
                    take: 1
                }
            },
            take: 50
        });

        return products.map(product => ({
            id: product.id,
            name: product.name,
            images: product.images,
            price: product.skus[0]?.price,
            shopId: product.shopId
        }));
    }

    async findAllDraftsForShop({ productShopId, skip = 0, take = 10 }) {
        return await this.prismaService.spu.findMany({
            where: {
                shopId: productShopId,
                status: 0, // Unaudited status indicates draft
                isActive: true
            },
            include: {
                skus: {
                    where: { isActive: true },
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        image: true,
                        num: true
                    }
                },
                brand: {
                    select: { name: true }
                },
                category: {
                    select: { name: true }
                }
            },
            skip,
            take,
            orderBy: { createdAt: 'desc' }
        });
    }

    async findAllPublishForShop({ productShopId, skip = 0, take = 10 }) {
        return await this.prismaService.spu.findMany({
            where: {
                shopId: productShopId,
                status: 1, // Reviewed status indicates published
                isMarketable: true, // Published products should be marketable
                isActive: true
            },
            include: {
            skus: {
                where: { isActive: true },
                select: {
                    id: true,
                    name: true,
                    price: true,
                    image: true,
                    num: true
                }
            },
            brand: {
                select: { name: true }
            },
            category: {
                select: { name: true }
            }
            },
            skip,
            take,
            orderBy: { createdAt: 'desc' }
        });
    }

    async publishProductByShop({ productShopId, uuid, isDraft = false, isPublished = true }) {
        // Verify the product belongs to the shop
        const product = await this.prismaService.spu.findFirst({
            where: {
                id: uuid,
                shopId: productShopId,
                isActive: true
            }
        });

        if (!product) {
            throw new NotFoundException('Product not found or does not belong to this shop');
        }

        return await this.prismaService.spu.update({
            where: { id: uuid },
            data: {
                status: isPublished ? 1 : 0, // 1 = Reviewed/Published, 0 = Draft/Unaudited
                isMarketable: isPublished,
                updatedAt: Date.now()
            },
            include: {
                skus: {
                    where: { isActive: true }
                },
                brand: {
                    select: { name: true }
                },
                category: {
                    select: { name: true }
                }
            }
        });
    }

    async unPublishProductByShop({ productShopId, uuid, isDraft = true, isPublished = false }) {
        // Verify the product belongs to the shop
        const product = await this.prismaService.spu.findFirst({
            where: {
                id: uuid,
                shopId: productShopId,
                isActive: true
            }
        });

        if (!product) {
            throw new NotFoundException('Product not found or does not belong to this shop');
        }

        return await this.prismaService.spu.update({
            where: { id: uuid },
            data: {
                status: 0, // Set back to unaudited/draft
                isMarketable: false,
                updatedAt: Date.now()
            },
            include: {
                skus: {
                    where: { isActive: true }
                },
                brand: {
                    select: { name: true }
                },
                category: {
                    select: { name: true }
                }
            }
        });
    }

    async findAllProducts({ take = 50, skip = 0, filter = { isPublished: true } }) {
        const whereCondition: any = {
            isActive: true
        };

        // Apply filters based on the filter parameter
        if (filter.isPublished) {
            whereCondition.status = 1; // Reviewed/Published
            whereCondition.isMarketable = true;
        }

        return await this.prismaService.spu.findMany({
            where: whereCondition,
            select: {
            id: true,
            name: true, // productName equivalent
            images: true, // productThumb equivalent (first image)
            shopId: true,
            createdAt: true,
            updatedAt: true,
            skus: {
                where: { isActive: true },
                select: {
                    price: true // productPrice equivalent
                },
                take: 1
            },
            brand: {
                select: { name: true }
            },
            category: {
                select: { name: true }
            }
            },
            take,
            skip,
            orderBy: { createdAt: 'desc' }
        });
    }

    async findUniqueProduct(productId: string) {
        const product = await this.prismaService.spu.findUnique({
            where: {
                    id: productId,
                    isActive: true
                },
            include: {
                skus: {
                    where: { isActive: true },
                    include: { inventory: true }
                },
                brand: true,
                category: true,
                comment: {
                    where: { isActive: true },
                    include: {
                    commentUser: {
                        select: {
                            id: true,
                            profile: {
                                select: {
                                    name: true,
                                    avatar: true
                                }
                            }
                        }
                    }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        return product;
    }


}