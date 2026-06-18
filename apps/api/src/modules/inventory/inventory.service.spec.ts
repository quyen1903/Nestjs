import { BadRequestException } from '@nestjs/common';
import { InventoryService } from './inventory.service';

describe('InventoryService', () => {
  it('uses an atomic stock predicate when subtracting inventory', async () => {
    const prismaService = {
      inventory: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUnique: jest.fn().mockResolvedValue({
          id: 'inventory-1',
          inventoryStock: 5,
        }),
      },
    };
    const service = new InventoryService(prismaService as any);

    await service.subtractStockToInventory(
      { productId: 'sku-1', stock: 2, location: 'warehouse' },
      'shop-1',
    );

    expect(prismaService.inventory.updateMany).toHaveBeenCalledWith({
      where: {
        inventoryProductId: 'sku-1',
        shopBusinessId: 'shop-1',
        inventoryStock: {
          gte: 2,
        },
      },
      data: {
        inventoryStock: { decrement: 2 },
        updatedAt: expect.anything(),
      },
    });
  });

  it('rejects oversell when the atomic decrement does not update a row', async () => {
    const prismaService = {
      inventory: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        findFirst: jest.fn().mockResolvedValue({
          id: 'inventory-1',
          inventoryStock: 1,
        }),
      },
    };
    const service = new InventoryService(prismaService as any);

    await expect(
      service.subtractStockToInventory(
        { productId: 'sku-1', stock: 2, location: 'warehouse' },
        'shop-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
