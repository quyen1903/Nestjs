import { Module } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CheckoutController } from './checkout.controller';
import { PrismaModule } from 'src/services/prisma/prisma.module';
import { KeyTokenModule } from '../keytoken/keytoken.module';
import { AuthModule } from '../auth/auth.module';
import { DiscountModule } from '../discount/discount.module';
import { ProductModule } from '../product/product.module';
import { CheckoutApplicationService } from './application/checkout.application.service';
import { CheckoutRepository } from './infrastructure/checkout.repository';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    KeyTokenModule,
    DiscountModule,
    ProductModule,
    JwtModule,
  ],
  controllers: [CheckoutController],
  providers: [CheckoutService, CheckoutApplicationService, CheckoutRepository],
})
export class CheckoutModule {}
