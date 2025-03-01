import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { ShopModule } from './modules/shop/shop.module';
import { PrismaModule } from './services/prisma/prisma.module';
import { KeyTokenModule } from './modules/keytoken/keytoken.module';
import { ProductModule } from './modules/product/product.module';
import { DiscountModule } from './modules/discount/discount.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { CartModule } from './modules/cart/cart.module';
import { UserModule } from './modules/user/user.module';
import { KafkaModule } from './services/kafka/kafka.module';
@Module({
  imports: [
    AuthModule,
    ShopModule,
    PrismaModule,
    KeyTokenModule,
    ProductModule,
    DiscountModule,
    InventoryModule,
    CartModule,
    UserModule,
    KafkaModule
  ],
})
export class AppModule {}
