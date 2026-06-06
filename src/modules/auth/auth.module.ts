import { Module } from '@nestjs/common';
import { DrizzleModule } from 'src/database/drizzle.module';
import { KeyTokenModule } from '../keytoken/keytoken.module';
import { ShopAuthModule } from './shop-auth/shop-auth.module';
import { UserAuthModule } from './user-auth/user-auth.module';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './user-auth/strategies/google.strategy';
import { KafkaModule } from 'src/services/kafka/kafka.module';
import { RouterModule } from '@nestjs/core';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtAccessAuthGuard } from './guards/jwt-access-auth.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';
@Module({
    imports:[
        JwtModule,
        DrizzleModule,
        KeyTokenModule,
        ShopAuthModule,
        UserAuthModule,
        KafkaModule,
        RouterModule.register([
            {
                path:'auth',
                module: AuthModule,
                children:[
                    {path:'shop', module: ShopAuthModule},
                    {path:'user', module: UserAuthModule}
                ]
            }
        ])
    ],
    providers:[AuthService, GoogleStrategy, JwtAccessStrategy, JwtRefreshStrategy, JwtAccessAuthGuard, JwtRefreshAuthGuard],
    controllers:[AuthController],
    exports: [AuthService, JwtAccessAuthGuard, JwtRefreshAuthGuard]
})
export class AuthModule {}
