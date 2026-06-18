import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { InventoryDTO } from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prismaService: PrismaService) {}

  private async getSkuForShop(productId: string, shopBusinessId: string) {
    return this.prismaService.sku.findFirst({
      where: {
        id: productId,
        spu: {
          shopBusinessId,
        },
      },
      include: {
        spu: {
          select: {
            shopBusinessId: true,
          },
        },
      },
    });
  }

  async addStockToInventory(
    { stock, productId, location = '17A, Conghoa' }: InventoryDTO,
    shopBusinessId: string,
  ) {
    if (stock <= 0) {
      throw new BadRequestException('Stock to add must be greater than 0');
    }

    const sku = await this.getSkuForShop(productId, shopBusinessId);
    if (!sku) {
      throw new BadRequestException('Product not found for this shop');
    }

    return this.prismaService.inventory.upsert({
      where: { inventoryProductId: productId },
      update: {
        inventoryStock: { increment: stock },
        inventoryLocation: location,
        updatedAt: BigInt(Date.now()),
      },
      create: {
        inventoryStock: stock,
        inventoryLocation: location,
        inventoryProductId: productId,
        shopBusinessId,
        createdAt: BigInt(Date.now()),
        updatedAt: BigInt(Date.now()),
      },
    });
  }

  async subtractStockToInventory(
    { stock, productId }: InventoryDTO,
    shopBusinessId: string,
  ) {
    if (stock <= 0) {
      throw new BadRequestException('Stock to subtract must be greater than 0');
    }

    const result = await this.prismaService.inventory.updateMany({
      where: {
        inventoryProductId: productId,
        shopBusinessId,
        inventoryStock: {
          gte: stock,
        },
      },
      data: {
        inventoryStock: { decrement: stock },
        updatedAt: BigInt(Date.now()),
      },
    });

    if (result.count !== 1) {
      const inventory = await this.prismaService.inventory.findFirst({
        where: {
          inventoryProductId: productId,
          shopBusinessId,
        },
      });

      if (!inventory) {
        throw new BadRequestException('Inventory not found for this shop');
      }

      throw new BadRequestException('Not enough stock available');
    }

    return this.prismaService.inventory.findUnique({
      where: { inventoryProductId: productId },
    });
  }
}
