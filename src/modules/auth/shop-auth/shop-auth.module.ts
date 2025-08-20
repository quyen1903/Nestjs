import { Module } from '@nestjs/common';
import { ShopAuthService } from './shop-auth.service';
import { ShopAuthController } from './shop-auth.controller';
import { PrismaModule } from 'src/services/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { ShopAuthGuard } from './auth-jwt.guard';
import { ShopModule } from 'src/modules/shop/shop.module';
import { KafkaModule } from 'src/services/kafka/kafka.module';

@Module({
  imports: [PrismaModule, JwtModule.register({}), ShopModule, KafkaModule],
  controllers: [ShopAuthController],
  providers: [ShopAuthService,  ShopAuthGuard],
  exports: [ShopAuthService, ShopAuthGuard, JwtModule]
})
export class ShopAuthModule {}
