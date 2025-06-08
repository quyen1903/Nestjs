import { Module } from '@nestjs/common';
import { ShopAuthService } from './shop-auth.service';
import { ShopAuthController } from './shop-auth.controller';
import { ShopKeyTokenService } from './shop-auth.keytoken';
import { PrismaModule } from 'src/services/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { ShopAuthGuard } from './auth-jwt.guard';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [ShopAuthController],
  providers: [ShopAuthService, ShopKeyTokenService, ShopAuthGuard],
  exports: [ShopAuthService, ShopKeyTokenService, ShopAuthGuard, JwtModule]
})
export class ShopAuthModule {}
