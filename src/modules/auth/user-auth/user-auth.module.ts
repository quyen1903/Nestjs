import { Module } from '@nestjs/common';
import { UserAuthService } from './user-auth.service';
import { UserAuthController } from './user-auth.controller';
import { PrismaModule } from 'src/services/prisma/prisma.module';
import { UserKeyTokenService } from './user-auth.keytoken';
import { UserAuthGuard } from './auth-jwt.guard';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { KafkaModule } from 'src/services/kafka/kafka.module';
import { EmailModule } from 'src/services/email/email.module';
@Module({
  imports: [PrismaModule, JwtModule, ConfigModule,EmailModule, KafkaModule],
  controllers: [UserAuthController],
  providers: [UserAuthService, UserKeyTokenService, UserAuthGuard, ],
  exports: [UserAuthService, UserKeyTokenService, UserAuthGuard]
})
export class UserAuthModule {}
