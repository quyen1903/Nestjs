import { Body, Controller, Post } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CheckoutDTO } from './dto/checkout.dto';

@Controller('checkout')
export class CheckoutController {
    constructor(private readonly checkoutService: CheckoutService) {}

    @Post('review')
    checkoutReview(@Body() payload: CheckoutDTO){
        return this.checkoutService.checkoutReview(payload)
    }

    @Post('create_order')
    createOrder(@Body() payload: CheckoutDTO){
        return this.checkoutService.createOrderByUser(payload.shopOrderIds, payload.cartId, payload.userId)
    }
}
