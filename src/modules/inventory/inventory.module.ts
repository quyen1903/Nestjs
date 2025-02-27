import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { AuthModule } from '../auth/auth.module';
import { KeyTokenModule } from '../keytoken/keytoken.module';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { Factory } from '../product/services/factory.service';
import { ProductModule } from '../product/product.module';
@Module({
  imports: [AuthModule, KeyTokenModule, ProductModule],
  controllers: [InventoryController,],
  providers: [InventoryService, PrismaService, Factory],
})
export class InventoryModule {}
