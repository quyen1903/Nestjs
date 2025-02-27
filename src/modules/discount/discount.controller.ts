import { Controller, UseGuards,Post, Body, Get, Query, Delete } from '@nestjs/common';
import { DiscountService } from './discount.service';
import { CreateDiscountDTO } from './dto/createDiscount.dto';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { AuthRequest } from '../auth/dto/auth-request.dto';
import { IJWTdecode } from 'src/shared/interfaces/jwt.interface';
import { AuthGuard } from '../auth/auth-jwt.guard';
import { AmountDiscountDTO } from './dto/amountDiscount.dto';

@UseGuards(ApiKeyGuard)
@Controller('discount')
export class DiscountController {
    constructor(private readonly discountService: DiscountService) {}

    @Post('')
    @UseGuards(AuthGuard)
    createDiscountCode(@Body() payload:CreateDiscountDTO, @AuthRequest('account') account:IJWTdecode){
        console.log("accountId",account.accountId)
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
    @UseGuards(AuthGuard)
    getAllDiscountCodes(
        @AuthRequest('account') account: IJWTdecode,
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
    @UseGuards(AuthGuard)
    deleteDiscountCode(@Body() payload){
        return this.discountService.deleteDiscountCode(payload)
    }

}
