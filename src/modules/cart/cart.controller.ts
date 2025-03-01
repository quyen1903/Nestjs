import { Body, Controller, Delete, Post,Get, Query, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { CreateCartDTO } from './dto/create-cart.dto';
import { UpdateCartDTO } from './dto/update-cart.dto';

UseGuards(ApiKeyGuard)
@Controller('cart')
export class CartController {
    constructor(private readonly cartService: CartService) {}


    @Post('')
    addToCart(@Body() payload: CreateCartDTO){
        return this.cartService.addToCart(payload)
    }

    @Post('update')
    update(@Body() payload: UpdateCartDTO){
        return this.cartService.update(payload)
    }

    @Delete('')
    delete(@Body() payload: {userId:string, productId: string}){
        return this.cartService.deleteUserCart(payload.userId, payload.productId)
    }

    @Get('')
    listToCart(@Query('userId') userId: string){
        return this.cartService.getListUserCart(userId)
    }
}
