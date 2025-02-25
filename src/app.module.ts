import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { ShopModule } from './modules/shop/shop.module';
import { PrismaModule } from './services/prisma/prisma.module';
import { KeyTokenModule } from './modules/keytoken/keytoken.module';
import { ProductModule } from './modules/product/product.module';
@Module({
  imports: [AuthModule, ShopModule, PrismaModule, KeyTokenModule, ProductModule],
})
export class AppModule {}
