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
import { CheckoutModule } from './modules/checkout/checkout.module';
import { CommentModule } from './modules/comment/comment.module';
import { MurLockModule } from 'murlock';
import { REDIS_URL } from './app.config';
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
    KafkaModule,
    CheckoutModule,
    CommentModule,
    MurLockModule.forRoot({
      redisOptions: { url:REDIS_URL },
      wait: 1000,
      maxAttempts: 3,
      logLevel: 'log',
      ignoreUnlockFail: false,
    }),
    
  ],
})
export class AppModule {}
