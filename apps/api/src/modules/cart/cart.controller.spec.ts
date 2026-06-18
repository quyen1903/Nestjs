import { GUARDS_METADATA } from '@nestjs/common/constants';
import { AccountType } from 'prisma/generated/prisma';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { RoleGuard } from '../auth/auth-role.guard';
import { ROLES_KEY } from '../auth/roles.decorator';
import { CartController } from './cart.controller';

describe('CartController', () => {
  it('uses authenticated user id instead of client-supplied user id when adding to cart', () => {
    const cartService = {
      addToCart: jest.fn(),
    };
    const controller = new CartController(cartService as any);

    controller.addToCart(
      {
        userId: 'attacker-user-id',
        product: {
          productId: 'sku-1',
          quantity: 1,
        },
      } as any,
      { accountId: 'authenticated-user-id' } as any,
    );

    expect(cartService.addToCart).toHaveBeenCalledWith(
      'authenticated-user-id',
      {
        productId: 'sku-1',
        quantity: 1,
      },
    );
  });

  it('requires user authentication for cart routes', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, CartController);
    const roles = Reflect.getMetadata(ROLES_KEY, CartController);

    expect(guards).toEqual(
      expect.arrayContaining([AccessTokenGuard, RoleGuard]),
    );
    expect(roles).toEqual([AccountType.USER]);
  });
});
