import { BadRequestException, Injectable } from '@nestjs/common';
import { DrizzleService } from 'src/database/drizzle.service';
import { InventoryDTO } from './dto/inventory.dto';
import { ProductService } from '../product/product.service';
@Injectable()
export class InventoryService{
    constructor(
        private readonly drizzleService: DrizzleService,
        private readonly productService: ProductService
    ){}

    private async getShopBusinessId(productId: string): Promise<string> {
    // Option 1: Get from product's SPU relation
    const product = await this.drizzleService.sku.findUnique({
        where: { id: productId },
        include: {
        spu: {
            select: { shopBusinessId: true }
        }
        }
    });
    
    return product?.spu?.shopBusinessId;
    
    // Option 2: Get from authenticated user context
    // return this.authService.getCurrentShopBusinessId();
    }

    async addStockToInventory({ stock, productId, location = '17A, Conghoa' }: InventoryDTO) {
        const product = await this.productService.findProduct(productId);

        if (!product) throw new BadRequestException('the product is not existed!!!');

        // Get the shopBusinessId - you'll need to determine how to get this
        // This could come from the authenticated user, product relation, or passed as parameter
        const shopBusinessId = await this.getShopBusinessId(productId); // You need to implement this

        const existedInventory = await this.drizzleService.inventory.findUnique({
            where: {inventoryProductId: product.id}
        });

        if (existedInventory) {
            return await this.drizzleService.inventory.update({
                where: { id: existedInventory.id },
                data: {
                    inventoryStock: { increment: stock },
                    updatedAt: Date.now()
                }
            });
        }

        // Fixed upsert with required shopBusinessId
        return await this.drizzleService.inventory.upsert({
            where: { inventoryProductId: productId },
            update: {
                inventoryStock: { increment: stock },
                updatedAt: Date.now()
            },
            create: {
                inventoryStock: stock,
                inventoryLocation: location,
                inventoryProductId: productId,
                shopBusinessId: shopBusinessId, // Add this required field
                createdAt: Date.now(),
                updatedAt: Date.now()
            }
        });
    }


    async subtractStockToInventory({ stock, productId }: InventoryDTO){
        if(stock <= 0) throw new BadRequestException('Stock to subtract must be greater than 0');

        const inventory = await this.drizzleService.inventory.findUnique({
            where:{ inventoryProductId: productId}
        });

        if(!inventory) throw new BadRequestException('inventory not found');

        if(inventory.inventoryStock < stock) throw new BadRequestException(' not enough stock available');

        return this.drizzleService.inventory.update({
            where:{
                id: inventory.id
            },
            data:{
                inventoryStock:{decrement: stock},
                updatedAt: Date.now()
            }
        })
    }
}