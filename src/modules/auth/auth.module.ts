import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/services/prisma/prisma.module';
import { KeyTokenModule } from '../keytoken/keytoken.module';
import { ShopAuthModule } from './shop-auth/shop-auth.module';
import { UserAuthModule } from './user-auth/user-auth.module';

@Module({
    imports:[PrismaModule, KeyTokenModule, ShopAuthModule, UserAuthModule],
    providers:[],
    exports:[]
})
export class AuthModule {}
