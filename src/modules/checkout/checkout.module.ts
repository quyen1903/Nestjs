import { Module } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CheckoutController } from './checkout.controller';
import { PrismaModule } from 'src/services/prisma/prisma.module';
import { KeyTokenModule } from '../keytoken/keytoken.module';
import { AuthModule } from '../auth/auth.module';
import { CartModule } from '../cart/cart.module';
import { DiscountModule } from '../discount/discount.module';
import { ProductModule } from '../product/product.module';

@Module({
  imports:[ AuthModule, PrismaModule, KeyTokenModule, CartModule, DiscountModule, ProductModule],
  controllers: [CheckoutController],
  providers: [CheckoutService],
})
export class CheckoutModule {}
