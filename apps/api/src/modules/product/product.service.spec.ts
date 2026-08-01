import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductService } from './product.service';

describe('ProductService', () => {
  const producerService = {
    getTopics: jest.fn(),
    produce: jest.fn(),
  };

  it('preserves requested quantity when checking products by server', async () => {
    const prismaService = {
      sku: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'sku-1',
          name: 'Server SKU',
          price: 25,
          stock: 10,
          spu: {
            name: 'Server Product',
            shopBusinessId: 'shop-1',
            isMarketable: true,
            status: 1,
          },
        }),
      },
    };
    const service = new ProductService(
      prismaService as any,
      producerService as any,
    );

    await expect(
      service.checkProductByServer([
        { productId: 'sku-1', quantity: 2, price: 999 },
      ]),
    ).resolves.toEqual([
      {
        price: 25,
        quantity: 2,
        productId: 'sku-1',
        shopId: 'shop-1',
        name: 'Server SKU',
      },
    ]);
  });

  it('rejects requested quantity above SKU stock', async () => {
    const prismaService = {
      sku: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'sku-1',
          name: 'Server SKU',
          price: 25,
          stock: 1,
          spu: {
            name: 'Server Product',
            shopBusinessId: 'shop-1',
            isMarketable: true,
            status: 1,
          },
        }),
      },
    };
    const service = new ProductService(
      prismaService as any,
      producerService as any,
    );

    await expect(
      service.checkProductByServer([{ productId: 'sku-1', quantity: 2 } as any]),
    ).rejects.toThrow(BadRequestException);
  });

  it('creates a root category and its self closure path', async () => {
    const tx = {
      category: {
        create: jest.fn().mockResolvedValue({ id: 'category-1', name: 'Smartphones', sort: 100 }),
      },
      categoryClosureTable: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const prismaService = {
      $transaction: jest.fn(async (callback) => callback(tx)),
    };
    const service = new ProductService(prismaService as any, producerService as any);

    await expect(
      service.createCategory({ name: '  Smartphones  ', sort: 100 }),
    ).resolves.toEqual({ id: 'category-1', name: 'Smartphones', sort: 100 });
    expect(tx.category.create).toHaveBeenCalledWith({
      data: { name: 'Smartphones', sort: 100 },
    });
    expect(tx.categoryClosureTable.createMany).toHaveBeenCalledWith({
      data: [{ ancestorId: 'category-1', descendantId: 'category-1', depth: 0 }],
    });
  });

  it('copies parent ancestor paths when creating a child category', async () => {
    const tx = {
      category: {
        findFirst: jest.fn().mockResolvedValue({ id: 'parent-1' }),
        create: jest.fn().mockResolvedValue({ id: 'category-1', name: 'Smartphones' }),
      },
      categoryClosureTable: {
        findMany: jest.fn().mockResolvedValue([
          { ancestorId: 'root-1', depth: 1 },
          { ancestorId: 'parent-1', depth: 0 },
        ]),
        createMany: jest.fn().mockResolvedValue({ count: 3 }),
      },
    };
    const prismaService = {
      $transaction: jest.fn(async (callback) => callback(tx)),
    };
    const service = new ProductService(prismaService as any, producerService as any);

    await service.createCategory({ name: 'Smartphones', parentId: 'parent-1' });

    expect(tx.categoryClosureTable.createMany).toHaveBeenCalledWith({
      data: [
        { ancestorId: 'category-1', descendantId: 'category-1', depth: 0 },
        { ancestorId: 'root-1', descendantId: 'category-1', depth: 2 },
        { ancestorId: 'parent-1', descendantId: 'category-1', depth: 1 },
      ],
    });
  });

  it('rejects a missing parent category', async () => {
    const tx = {
      category: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    const prismaService = {
      $transaction: jest.fn(async (callback) => callback(tx)),
    };
    const service = new ProductService(prismaService as any, producerService as any);

    await expect(
      service.createCategory({ name: 'Smartphones', parentId: 'missing-parent' }),
    ).rejects.toThrow(NotFoundException);
  });
});
