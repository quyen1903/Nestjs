import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { KeyTokenModule } from '../keytoken/keytoken.module';
import { AuthModule } from '../auth/auth.module';
import { DrizzleModule } from 'src/database/drizzle.module';
import { UserAuthModule } from '../auth/user-auth/user-auth.module';
@Module({
	imports:[AuthModule,KeyTokenModule, DrizzleModule, UserAuthModule],
	controllers: [CartController],
	providers: [CartService],
	exports: [CartService]
})
export class CartModule {}
