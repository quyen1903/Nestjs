import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { ShopModule } from './modules/shop/shop.module';
import { DrizzleModule } from './database/drizzle.module';
import { KeyTokenModule } from './modules/keytoken/keytoken.module';
import { ProductModule } from './modules/product/product.module';
import { DiscountModule } from './modules/discount/discount.module';
import { InventoryModule } from './modules/inventory/inventory.module';
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

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        AuthModule,
        ShopModule,
        DrizzleModule,
        KeyTokenModule,
        ProductModule,
        DiscountModule,
        InventoryModule,
        CartModule,
        UserModule,
        KafkaModule,
        CheckoutModule,
        CommentModule,
        DiscordModule,
        NotificationModule,
        EmailModule,
        PaymentModule,
    ],
    controllers:[AppController],
    providers: [DiscordService],
})
export class AppModule implements NestModule{
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(DiscordMiddleware, RequestIdMiddleware).forRoutes('*');
    }
}
