import { BadRequestException } from '@nestjs/common';
import { CheckoutApplicationService } from './checkout.application.service';

describe('CheckoutApplicationService', () => {
  it('rejects checkout when the cart does not belong to the authenticated user', async () => {
    const tx = {};
    const checkoutRepository = {
      transaction: jest.fn((handler) => handler(tx)),
      getCartByIdForUser: jest.fn().mockResolvedValue(null),
    };
    const service = new CheckoutApplicationService(
      checkoutRepository as any,
      {} as any,
      {} as any,
    );

    await expect(
      service.checkoutReview({
        cartId: 'cart-user-b',
        userId: 'user-a',
        shopOrderIds: [],
      }),
    ).rejects.toThrow(BadRequestException);

    expect(checkoutRepository.getCartByIdForUser).toHaveBeenCalledWith(
      tx,
      'cart-user-b',
      'user-a',
    );
  });

  it('rejects checkout items that exceed the authenticated user cart quantity', async () => {
    const tx = {};
    const checkoutRepository = {
      transaction: jest.fn((handler) => handler(tx)),
      getCartByIdForUser: jest.fn().mockResolvedValue({
        id: 'cart-user-a',
        userId: 'user-a',
      }),
      getCartProducts: jest.fn().mockResolvedValue([
        {
          productId: 'sku-1',
          quantity: 1,
        },
      ]),
    };
    const service = new CheckoutApplicationService(
      checkoutRepository as any,
      {} as any,
      {} as any,
    );

    await expect(
      service.checkoutReview({
        cartId: 'cart-user-a',
        userId: 'user-a',
        shopOrderIds: [
          {
            shopId: 'shop-1',
            shopDiscounts: [],
            itemProducts: [{ productId: 'sku-1', quantity: 2 }],
          },
        ],
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
