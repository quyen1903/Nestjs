import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { Factory } from '../product/services/factory.service';
import { InventoryDTO } from './dto/inventory.dto';
import { Product } from '@prisma/client';

@Injectable()
export class InventoryService{
    constructor(
        private readonly prismaService: PrismaService,
        private readonly factory: Factory
    ){}
    async addStockToInventory( { stock, productId, location = '17A, Conghoa' }: InventoryDTO ){
        const product: Product = await this.factory.getProductByIdMethod(productId);
        if(!product) throw new BadRequestException('the product is not existed!!!');

        const existedInventory = await this.prismaService.inventory.findUnique({
            where: {
                inventoryProductId: product.id
            }
        })

        if(existedInventory){
            return await this.prismaService.inventory.update({
                where:{ id: existedInventory.id},
                data:{
                    inventoryStock: {increment: stock},
                    updatedAt: Date.now()
                }
            })
        }
        
        //To make upsert() behave like a findOrCreate() method, provide an empty update parameter to upsert().
        return await this.prismaService.inventory.upsert({
            where:{
                inventoryProductId: productId
            },
            update:{},
            create:{
                inventoryStock: stock,
                inventoryLocation: location,
                inventoryReservations:[],
                inventoryProductId: productId
            }
        })
    }

    async subtractStockToInventory({ stock, productId }: InventoryDTO){
        if(stock <= 0) throw new BadRequestException('Stock to subtract must be greater than 0');

        const inventory = await this.prismaService.inventory.findUnique({
            where:{ inventoryProductId: productId}
        });

        if(!inventory) throw new BadRequestException('inventory not found');

        if(inventory.inventoryStock < stock) throw new BadRequestException(' not enough stock available');

        return this.prismaService.inventory.update({
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