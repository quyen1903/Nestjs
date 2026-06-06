import { Controller, UseGuards,Post, Body, Get, Query, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DiscountService } from './discount.service';
import { CreateDiscountDTO } from './dto/createDiscount.dto';
import { AuthRequest } from '../auth/dto/auth-request.dto';
import { JWTdecode } from 'src/shared/interfaces/jwt.interface';
import { AmountDiscountDTO } from './dto/amountDiscount.dto';
import { JwtAccessAuthGuard } from '../auth/guards/jwt-access-auth.guard';
import { ApiEndpoint } from 'src/shared/swagger/api-docs.decorator';
@Controller('discount')
@ApiTags('Discount')
export class DiscountController {
    constructor(private readonly discountService: DiscountService) {}

    @Post('')
    @UseGuards(JwtAccessAuthGuard)
    @ApiEndpoint({
        summary: 'Create a discount code for authenticated shop',
        auth: true,
        body: { type: CreateDiscountDTO },
        responses: [{ status: 201, description: 'Discount code created' }],
    })
    createDiscountCode(@Body() payload:CreateDiscountDTO, @AuthRequest('account') account:JWTdecode){
        return this.discountService.createDiscountCode(payload, account.accountId)
    }

    @Get('list_product_code')
    @ApiEndpoint({
        summary: 'Get products that can use a discount code',
        queries: [
            { name: 'shopId', required: true, example: 'shop_123' },
            { name: 'limit', required: false, example: 10, type: Number },
            { name: 'page', required: false, example: 1, type: Number },
            { name: 'code', required: true, example: 'SUMMER2026' },
        ],
    })
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
    @UseGuards(JwtAccessAuthGuard)
    @ApiEndpoint({
        summary: 'Get discount codes for authenticated shop',
        auth: true,
        queries: [
            { name: 'limit', required: false, example: 10, type: Number },
            { name: 'page', required: false, example: 1, type: Number },
        ],
    })
    getAllDiscountCodes(
        @AuthRequest('account') account: JWTdecode,
        @Query('limit') limit : number,
        @Query('page') page: number,
    ){
        return this.discountService.getAllDiscountCodesByShop( limit, page, account.accountId)
    }


    @Post('amount')
    @ApiEndpoint({
        summary: 'Calculate discount amount for an order',
        body: { type: AmountDiscountDTO },
        responses: [{ status: 201, description: 'Discount amount calculated' }],
    })
    getDiscountAmount(@Body() payload: AmountDiscountDTO){
        return this.discountService.getDiscountAmount(payload)
    }

    @Delete('')
    @UseGuards(JwtAccessAuthGuard)
    @ApiEndpoint({
        summary: 'Delete a discount code',
        auth: true,
        body: { type: AmountDiscountDTO },
    })
    deleteDiscountCode(@Body() payload){
        return this.discountService.deleteDiscountCode(payload)
    }

}
