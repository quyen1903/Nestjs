import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { Factory } from '../product/services/factory.service';
import { InventoryDTO } from './dto/inventory.dto';

@Injectable()
export class InventoryService{
    constructor(
        private readonly prismaService: PrismaService,
        private readonly factory: Factory
    ){}
    async addStockToInventory( { stock, productId, location = '17A, Conghoa' }: InventoryDTO ){
        const product = await this.factory.getProductByIdMethod(productId)
        if(!product) throw new BadRequestException('the product is not existed!!!')
        
        //To make upsert() behave like a findOrCreate() method, provide an empty update parameter to upsert().
        return this.prismaService.inventory.upsert({
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
}