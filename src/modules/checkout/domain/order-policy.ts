import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from 'prisma/generated/prisma';

export class OrderPolicy {
  static assertCanCancel(status: OrderStatus) {
    if (status === OrderStatus.DELIVERED) {
      throw new BadRequestException('Cannot cancel a delivered order');
    }

    if (status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order is already cancelled');
    }

    if (status === OrderStatus.SHIPPED) {
      throw new BadRequestException(
        'Cannot cancel a shipped order. Please contact support.',
      );
    }
  }

  static assertCanUpdateShippingAddress(status: OrderStatus) {
    if (status === OrderStatus.DELIVERED) {
      throw new BadRequestException('Cannot update a delivered order');
    }

    if (status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot update a cancelled order');
    }

    if (status === OrderStatus.SHIPPED) {
      throw new BadRequestException(
        'Cannot update shipping address for a shipped order',
      );
    }
  }
}
