import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { AuthModule } from '../auth/auth.module';
import { KeyTokenModule } from '../keytoken/keytoken.module';
import { PrismaModule } from 'src/services/prisma/prisma.module';
import { KafkaModule } from 'src/services/kafka/kafka.module';
import { ShopAuthModule } from '../auth/shop-auth/shop-auth.module';
@Module({
  imports:[ AuthModule, KeyTokenModule, PrismaModule, KafkaModule, ShopAuthModule, ],
  controllers: [ProductController],
  providers: [ ProductService ],
  exports: [ ProductService ]
})
export class ProductModule {}
