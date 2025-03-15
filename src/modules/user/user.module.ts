import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/services/prisma/prisma.module';
import { ShopController } from './user.controller';
import { UserService } from './user.service';
import { AuthModule } from '../auth/auth.module';
import { KeyTokenModule } from '../keytoken/keytoken.module';
import { EmailModule } from 'src/services/email/email.module';
@Module({
    imports:[PrismaModule, AuthModule, KeyTokenModule, EmailModule],//import prisma module to use prisma's services
    controllers:[ShopController],//controller to handle http
    providers:[ UserService],// register these services 
    exports: [UserService]// services which can be use by another module when import this module
})
export class UserModule {}
