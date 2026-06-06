import { Module } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CheckoutController } from './checkout.controller';
import { DrizzleModule } from 'src/database/drizzle.module';
import { KeyTokenModule } from '../keytoken/keytoken.module';
import { AuthModule } from '../auth/auth.module';
import { DiscountModule } from '../discount/discount.module';
import { ProductModule } from '../product/product.module';
import { CheckoutApplicationService } from './application/checkout.application.service';
import { CheckoutRepository } from './infrastructure/checkout.repository';

@Module({
  imports: [
    AuthModule,
    DrizzleModule,
    KeyTokenModule,
    DiscountModule,
    ProductModule,
  ],
  controllers: [CheckoutController],
  providers: [CheckoutService, CheckoutApplicationService, CheckoutRepository],
})
export class CheckoutModule {}
