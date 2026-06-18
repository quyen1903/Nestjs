import { BadRequestException } from '@nestjs/common';
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
});
