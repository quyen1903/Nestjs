import { Module } from '@nestjs/common';
import { ProductService } from './services/product.service';
import { Factory } from './services/factory.service';
import { ClothingService } from './services/clothing.service';
import { ElectronicService } from './services/electronic.service';
import { FurnitureService } from './services/furniture.service';
import { ProductController } from './product.controller';
import { AuthModule } from '../auth/auth.module';
import { KeyTokenModule } from '../keytoken/keytoken.module';
import { PrismaModule } from 'src/services/prisma/prisma.module';
import { KafkaModule } from 'src/services/kafka/kafka.module';
import { ShopAuthModule } from '../auth/shop-auth/shop-auth.module';
@Module({
  imports:[ AuthModule, KeyTokenModule, PrismaModule, KafkaModule, ShopAuthModule],
  controllers: [ProductController],
  providers: [ Factory, ProductService, ClothingService, ElectronicService, FurnitureService],
  exports: [Factory, ProductService, ClothingService, ElectronicService, FurnitureService]
})
export class ProductModule {}
