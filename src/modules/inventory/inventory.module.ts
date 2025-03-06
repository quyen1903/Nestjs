import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { AuthModule } from '../auth/auth.module';
import { KeyTokenModule } from '../keytoken/keytoken.module';
import { ProductModule } from '../product/product.module';
import { PrismaModule } from 'src/services/prisma/prisma.module';
@Module({
    imports: [AuthModule, KeyTokenModule, ProductModule, PrismaModule],
    controllers: [InventoryController,],
    providers: [InventoryService],
})
export class InventoryModule {}
