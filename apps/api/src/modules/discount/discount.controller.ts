import { Controller, UseGuards,Post, Body, Get, Query, Delete } from '@nestjs/common';
import { DiscountService } from './discount.service';
import { CreateDiscountDTO } from './dto/createDiscount.dto';
import { AuthRequest } from '../auth/dto/auth-request.dto';
import { JWTdecode } from 'src/shared/interfaces/jwt.interface';
import { AmountDiscountDTO } from './dto/amountDiscount.dto';
import { AccessTokenGuard } from '../auth/access-token.guard';
@Controller('discount')
export class DiscountController {
    constructor(private readonly discountService: DiscountService) {}

    @Post('')
    @UseGuards(AccessTokenGuard)
    createDiscountCode(@Body() payload:CreateDiscountDTO, @AuthRequest('account') account:JWTdecode){
        return this.discountService.createDiscountCode(payload, account.accountId)
    }

    @Get('list_product_code')
    getAllDiscountCodesWithProducts(
        @Query('shopId') shopId: string,
        @Query('limit') limit : number,
        @Query('page') page: number,
        @Query('code') code: string
    ){
        return this.discountService.getAllDiscountCodesWithProduct({
            discountCode: code,
            discountShopId:shopId,
            discountLimit: limit,
            discountPage: page
        })
    }

    @Get('')
    @UseGuards(AccessTokenGuard)
    getAllDiscountCodes(
        @AuthRequest('account') account: JWTdecode,
        @Query('limit') limit : number,
        @Query('page') page: number,
    ){
        return this.discountService.getAllDiscountCodesByShop( limit, page, account.accountId)
    }


    @Post('amount')
    getDiscountAmount(@Body() payload: AmountDiscountDTO){
        return this.discountService.getDiscountAmount(payload)
    }

    @Delete('')
    @UseGuards(AccessTokenGuard)
    deleteDiscountCode(@Body() payload){
        return this.discountService.deleteDiscountCode(payload)
    }

}
