import { Module } from '@nestjs/common';
import { DiscountService } from './discount.service';
import { DiscountController } from './discount.controller';
import { AuthModule } from '../auth/auth.module';
import { KeyTokenModule } from '../keytoken/keytoken.module';
import { ProductModule } from '../product/product.module';
import { DrizzleModule } from 'src/database/drizzle.module';
import { KafkaModule } from 'src/services/kafka/kafka.module';
import { JwtModule } from '@nestjs/jwt';
@Module({
  imports:[ AuthModule, KeyTokenModule, ProductModule, DrizzleModule, KafkaModule, JwtModule],
  controllers: [DiscountController],
  providers: [DiscountService],
  exports: [DiscountService]
})
export class DiscountModule {}
