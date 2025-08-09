import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RouterModule } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { ShopModule } from './modules/shop/shop.module';
import { PrismaModule } from './services/prisma/prisma.module';
import { KeyTokenModule } from './modules/keytoken/keytoken.module';
import { ProductModule } from './modules/product/product.module';
import { DiscountModule } from './modules/discount/discount.module';
import { InventoryModule } from './modules/product/inventory/inventory.module';
import { CartModule } from './modules/cart/cart.module';
import { UserModule } from './modules/user/user.module';
import { KafkaModule } from './services/kafka/kafka.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { CommentModule } from './modules/comment/comment.module';
import { DiscordModule } from './services/discord/discord.module';
import { DiscordService } from './services/discord/discord.service';
import { DiscordMiddleware } from './middleware/discord.middleware';
import { NotificationModule } from './modules/notification/notification.module';
import { EmailModule } from './services/email/email.module';
import { AppController } from './app.controller';
import { PaymentModule } from './modules/payment/payment.module';
import { RequestIdMiddleware } from './middleware/request-id.middleware';
import { ShopAuthModule } from './modules/auth/shop-auth/shop-auth.module';
import { UserAuthModule } from './modules/auth/user-auth/user-auth.module';
import { AccountModule } from './modules/account/account.module';
@Module({
    imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
        AuthModule,
        ShopModule,
        PrismaModule,
        KeyTokenModule,
        ProductModule,
        DiscountModule,
        CartModule,
        UserModule,
        KafkaModule,
        CheckoutModule,
        CommentModule,
        ConfigModule.forRoot(),
        DiscordModule,
        NotificationModule,
        EmailModule,
        PaymentModule,
        RouterModule.register([
            {
                path: 'auth',
                module: AuthModule,
                children:[
                    {
                        path: 'shop',
                        module: ShopAuthModule
                    },
                    {
                        path: 'user',
                        module: UserAuthModule
                    }
                ]
            },{
                path: 'product',
                module: ProductModule,
                children:[
                    {
                        path: 'inventory',
                        module: InventoryModule
                    }
                ]
            }
        ]),
        AccountModule
    ],
    controllers:[AppController],
    providers: [DiscordService],
})
export class AppModule implements NestModule{
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(DiscordMiddleware, RequestIdMiddleware).forRoutes('*');
    }
}
