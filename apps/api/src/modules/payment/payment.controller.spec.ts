import { GUARDS_METADATA } from '@nestjs/common/constants';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { RoleGuard } from '../auth/auth-role.guard';
import { PaymentController } from './payment.controller';

describe('PaymentController', () => {
  it.each([
    'createPayment',
    'getPayment',
    'refundPayment',
    'createCustomer',
  ] as const)('requires auth guards for %s', (methodName) => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      PaymentController.prototype[methodName],
    );

    expect(guards).toEqual(
      expect.arrayContaining([AccessTokenGuard, RoleGuard]),
    );
  });

  it('does not require app auth for Stripe webhook signature verification', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      PaymentController.prototype.handleWebhook,
    );

    expect(guards).toBeUndefined();
  });
});
