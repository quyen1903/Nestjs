import { Module } from '@nestjs/common';
import { UserAuthService } from './user-auth.service';
import { UserAuthController } from './user-auth.controller';
import { PrismaModule } from 'src/services/prisma/prisma.module';
import { UserKeyTokenService } from './user-auth.keytoken';
import { UserAuthGuard } from './auth-jwt.guard';
import { JwtModule } from '@nestjs/jwt';
@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [UserAuthController],
  providers: [UserAuthService, UserKeyTokenService, UserAuthGuard],
  exports: [UserAuthService, UserKeyTokenService, UserAuthGuard]
})
export class UserAuthModule {}
