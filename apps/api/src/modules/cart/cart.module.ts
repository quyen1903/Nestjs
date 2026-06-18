import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { KeyTokenModule } from '../keytoken/keytoken.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from 'src/services/prisma/prisma.module';
import { UserAuthModule } from '../auth/user-auth/user-auth.module';
import { JwtModule } from '@nestjs/jwt';
@Module({
	imports:[AuthModule, KeyTokenModule, PrismaModule, UserAuthModule, JwtModule],
	controllers: [CartController],
	providers: [CartService],
	exports: [CartService]
})
export class CartModule {}
