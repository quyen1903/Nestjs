import { Module } from '@nestjs/common';
import { UserAuthService } from './user-auth.service';
import { UserAuthController } from './user-auth.controller';
import { PrismaModule } from 'src/services/prisma/prisma.module';
import { KeyTokenService } from 'src/modules/keytoken/keytoken.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { KafkaModule } from 'src/services/kafka/kafka.module';
import { EmailModule } from 'src/services/email/email.module';
@Module({
  imports: [PrismaModule, JwtModule, ConfigModule,EmailModule, KafkaModule],
  controllers: [UserAuthController],
  providers: [UserAuthService, KeyTokenService, ],
  exports: [UserAuthService, KeyTokenService, ]
})
export class UserAuthModule {}
