import { Module } from '@nestjs/common';
import { DrizzleModule } from 'src/database/drizzle.module';
import { ShopController } from './shop.controller';
import { ShopService } from './shop.service';
import { AuthModule } from '../auth/auth.module';
import { KeyTokenModule } from '../keytoken/keytoken.module';
import { KafkaModule } from 'src/services/kafka/kafka.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
    imports:[DrizzleModule, KeyTokenModule, KafkaModule, JwtModule, AuthModule],
    controllers:[ShopController],//controller to handle http
    providers:[ ShopService],// register these services 
    exports: [ShopService]// services which can be use by another module when import this module
})
export class ShopModule {}
