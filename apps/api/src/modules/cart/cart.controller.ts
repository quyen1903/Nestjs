import { Body, Controller, Delete, Post, Get, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartDTO } from './dto/create-cart.dto';
import { UpdateCartDTO } from './dto/update-cart.dto';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { RoleGuard } from '../auth/auth-role.guard';
import { Roles } from '../auth/roles.decorator';
import { AccountType } from 'prisma/generated/prisma';
import { AuthRequest } from '../auth/dto/auth-request.dto';
import { JWTdecode } from 'src/shared/interfaces/jwt.interface';

@Controller('cart')
@UseGuards(AccessTokenGuard, RoleGuard)
@Roles(AccountType.USER)
export class CartController {
    constructor(private readonly cartService: CartService) {}


    @Post('')
    addToCart(@Body() payload: CreateCartDTO, @AuthRequest('account') account: JWTdecode){
        return this.cartService.addToCart(account.accountId, payload.product)
    }

    @Post('update')
    update(@Body() payload: UpdateCartDTO, @AuthRequest('account') account: JWTdecode){
        return this.cartService.update(account.accountId, payload.shopOrderIds)
    }

    @Delete('')
    delete(@Body() payload: { productId: string }, @AuthRequest('account') account: JWTdecode){
        return this.cartService.deleteUserCart(account.accountId, payload.productId)
    }

    @Get('')
    listToCart(@AuthRequest('account') account: JWTdecode){
        return this.cartService.getListUserCart(account.accountId)
    }
}
