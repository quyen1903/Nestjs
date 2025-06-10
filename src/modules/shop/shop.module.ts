import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/services/prisma/prisma.module';
import { ShopController } from './shop.controller';
import { ShopService } from './shop.service';
import { AuthModule } from '../auth/auth.module';
import { KeyTokenModule } from '../keytoken/keytoken.module';
import { KafkaModule } from 'src/services/kafka/kafka.module';
import { JwtModule } from '@nestjs/jwt';
import { ShopAuthModule } from '../auth/shop-auth/shop-auth.module';
import { ApiModule } from '../api/api.module';

@Module({
    imports:[PrismaModule, AuthModule, KeyTokenModule, KafkaModule, JwtModule, ShopAuthModule, ApiModule],//import prisma module to use prisma's services
    controllers:[ShopController],//controller to handle http
    providers:[ ShopService],// register these services 
    exports: [ShopService]// services which can be use by another module when import this module
})
export class ShopModule {}
