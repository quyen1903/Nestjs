import { Module } from '@nestjs/common';
import { ProductService } from './services/product.service';
import { Factory } from './services/factory.service';
import { ProductController } from './product.controller';
import { AuthModule } from '../auth/auth.module';
import { KeyTokenModule } from '../keytoken/keytoken.module';
import { PrismaModule } from 'src/services/prisma/prisma.module';
import { KafkaModule } from 'src/services/kafka/kafka.module';
import { ShopAuthModule } from '../auth/shop-auth/shop-auth.module';
import { InventoryModule } from './inventory/inventory.module';
import { SkuModule } from './sku/sku.module';
import { SpuModule } from './spu/spu.module';

@Module({
  imports:[ AuthModule, KeyTokenModule, PrismaModule, KafkaModule, ShopAuthModule, InventoryModule, SkuModule, SpuModule ],
  controllers: [ProductController],
  providers: [ Factory, ProductService],
  exports: [Factory, ProductService]
})
export class ProductModule {}
