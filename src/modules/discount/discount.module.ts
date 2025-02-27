import { Module } from '@nestjs/common';
import { DiscountService } from './discount.service';
import { DiscountController } from './discount.controller';
import { AuthModule } from '../auth/auth.module';
import { KeyTokenModule } from '../keytoken/keytoken.module';
import { ProductModule } from '../product/product.module';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { Factory } from '../product/services/factory.service';
@Module({
  imports:[ AuthModule, KeyTokenModule, ProductModule ],
  controllers: [DiscountController],
  providers: [DiscountService, PrismaService, Factory],
})
export class DiscountModule {}
