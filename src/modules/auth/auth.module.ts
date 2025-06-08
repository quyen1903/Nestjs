import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/services/prisma/prisma.module';
import { KeyTokenModule } from '../keytoken/keytoken.module';
import { ShopAuthModule } from './shop-auth/shop-auth.module';
import { UserAuthModule } from './user-auth/user-auth.module';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
    imports:[JwtModule, PrismaModule, KeyTokenModule, ShopAuthModule, UserAuthModule],
    providers:[AuthService],
    exports: [AuthService, ShopAuthModule, UserAuthModule]
})
export class AuthModule {}
