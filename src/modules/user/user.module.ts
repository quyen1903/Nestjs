import { Module } from '@nestjs/common';
import { DrizzleModule } from 'src/database/drizzle.module';
import { ShopController } from './user.controller';
import { UserService } from './user.service';
import { KeyTokenModule } from '../keytoken/keytoken.module';
import { EmailModule } from 'src/services/email/email.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { UserAuthModule } from '../auth/user-auth/user-auth.module';
import { AuthService } from '../auth/auth.service';
import { KafkaModule } from 'src/services/kafka/kafka.module';
@Module({
    imports:[DrizzleModule,AuthModule, KeyTokenModule, EmailModule, JwtModule, UserAuthModule, KafkaModule],
    controllers:[ShopController],//controller to handle http
    providers:[ UserService, AuthService],// register these services 
    exports: [UserService]// services which can be use by another module when import this module
})
export class UserModule {}
