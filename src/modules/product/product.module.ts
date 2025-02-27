import { Module } from '@nestjs/common';
import { ProductService } from './services/product.service';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { Factory } from './services/factory.service';
import { ClothingService } from './services/clothing.service';
import { ElectronicService } from './services/electronic.service';
import { FurnitureService } from './services/furniture.service';
import { ProductController } from './product.controller';
import { AuthModule } from '../auth/auth.module';
import { KeyTokenModule } from '../keytoken/keytoken.module';

@Module({
  imports:[ AuthModule, KeyTokenModule],
  controllers: [ProductController],
  providers: [ Factory, PrismaService, ProductService, ClothingService, ElectronicService, FurnitureService],
  exports: [Factory, ProductService, ClothingService, ElectronicService, FurnitureService]
})
export class ProductModule {}
