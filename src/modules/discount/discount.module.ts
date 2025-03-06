import { Module } from '@nestjs/common';
import { DiscountService } from './discount.service';
import { DiscountController } from './discount.controller';
import { AuthModule } from '../auth/auth.module';
import { KeyTokenModule } from '../keytoken/keytoken.module';
import { ProductModule } from '../product/product.module';
import { PrismaModule } from 'src/services/prisma/prisma.module';
@Module({
  imports:[ AuthModule, KeyTokenModule, ProductModule, PrismaModule ],
  controllers: [DiscountController],
  providers: [DiscountService],
  exports: [DiscountService]
})
export class DiscountModule {}
