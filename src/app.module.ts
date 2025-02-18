import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { ShopModule } from './modules/shop/shop.module';
import { PrismaModule } from './services/prisma/prisma.module';
import { KeyTokenModule } from './modules/keytoken/keytoken.module';
@Module({
  imports: [AuthModule, ShopModule, PrismaModule, KeyTokenModule],
})
export class AppModule {}
