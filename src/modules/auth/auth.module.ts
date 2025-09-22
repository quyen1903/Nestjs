import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/services/prisma/prisma.module';
import { KeyTokenModule } from '../keytoken/keytoken.module';
import { ShopAuthModule } from './shop-auth/shop-auth.module';
import { UserAuthModule } from './user-auth/user-auth.module';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './user-auth/strategies/google.strategy';
import { KafkaModule } from 'src/services/kafka/kafka.module';
@Module({
    imports:[JwtModule, PrismaModule, KeyTokenModule, ShopAuthModule, UserAuthModule, KafkaModule],
    providers:[AuthService, GoogleStrategy],
    controllers:[AuthController],
    exports: [AuthService]
})
export class AuthModule {}
