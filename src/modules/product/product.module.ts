import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { AuthModule } from '../auth/auth.module';
import { KeyTokenModule } from '../keytoken/keytoken.module';
import { DrizzleModule } from 'src/database/drizzle.module';
import { KafkaModule } from 'src/services/kafka/kafka.module';
import { ShopAuthModule } from '../auth/shop-auth/shop-auth.module';
import { JwtModule } from '@nestjs/jwt';
import { SpuModule } from './spu/spu.module';
import { BrandModule } from './brand/brand.module';
import { CategoryModule } from './category/category.module';

@Module({
  imports:[ AuthModule, KeyTokenModule, DrizzleModule, KafkaModule, ShopAuthModule, JwtModule, SpuModule, BrandModule, CategoryModule],
  controllers: [ProductController],
  providers: [ ProductService ],
  exports: [ ProductService ]
})
export class ProductModule {}
