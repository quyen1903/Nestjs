import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { KeyTokenModule } from '../keytoken/keytoken.module';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
@Module({
	imports:[AuthModule,KeyTokenModule],
	controllers: [CartController],
	providers: [CartService, PrismaService],
})
export class CartModule {}
