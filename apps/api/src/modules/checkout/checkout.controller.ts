import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CheckoutDTO } from './dto/checkout.dto';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { RoleGuard } from '../auth/auth-role.guard';
import { Roles } from '../auth/roles.decorator';
import { AccountType } from 'prisma/generated/prisma';
import { AuthRequest } from '../auth/dto/auth-request.dto';
import { JWTdecode } from 'src/shared/interfaces/jwt.interface';

@Controller('checkout')
@UseGuards(AccessTokenGuard, RoleGuard)
@Roles(AccountType.USER)
export class CheckoutController {
    constructor(private readonly checkoutService: CheckoutService) {}

    @Post('review')
    checkoutReview(@Body() payload: CheckoutDTO, @AuthRequest('account') account: JWTdecode){
        return this.checkoutService.checkoutReview(payload, account.accountId)
    }

    @Post('create_order')
    createOrder(@Body() payload: CheckoutDTO, @AuthRequest('account') account: JWTdecode){
        return this.checkoutService.createOrderByUser(payload.shopOrderIds, payload.cartId, account.accountId)
    }
}
