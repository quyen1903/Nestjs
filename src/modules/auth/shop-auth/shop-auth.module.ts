import { Module } from '@nestjs/common';
import { ShopAuthService } from './shop-auth.service';
import { ShopAuthController } from './shop-auth.controller';

@Module({
  controllers: [ShopAuthController],
  providers: [ShopAuthService],
})
export class ShopAuthModule {}
