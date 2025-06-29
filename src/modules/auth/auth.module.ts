import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/services/prisma/prisma.module';
import { KeyTokenModule } from '../keytoken/keytoken.module';
import { ShopAuthModule } from './shop-auth/shop-auth.module';
import { UserAuthModule } from './user-auth/user-auth.module';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ApiModule } from '../api/api.module';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './user-auth/strategies/google.strategy';
@Module({
    imports:[JwtModule, PrismaModule, KeyTokenModule, ShopAuthModule, UserAuthModule, ApiModule],
    providers:[AuthService, GoogleStrategy],
    controllers:[AuthController],
    exports: [AuthService, ShopAuthModule, UserAuthModule]
})
export class AuthModule {}
