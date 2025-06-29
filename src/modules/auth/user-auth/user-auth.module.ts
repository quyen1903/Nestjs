import { Module } from '@nestjs/common';
import { UserAuthService } from './user-auth.service';
import { UserAuthController } from './user-auth.controller';
import { PrismaModule } from 'src/services/prisma/prisma.module';
import { UserKeyTokenService } from './user-auth.keytoken';
import { UserAuthGuard } from './auth-jwt.guard';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [PrismaModule, JwtModule, ConfigModule],
  controllers: [UserAuthController],
  providers: [UserAuthService, UserKeyTokenService, UserAuthGuard, ],
  exports: [UserAuthService, UserKeyTokenService, UserAuthGuard]
})
export class UserAuthModule {}
