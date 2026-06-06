import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CheckoutService } from './checkout.service';
import { CheckoutDTO } from './dto/checkout.dto';
import { ApiEndpoint } from 'src/shared/swagger/api-docs.decorator';

@Controller('checkout')
@ApiTags('Checkout')
export class CheckoutController {
    constructor(private readonly checkoutService: CheckoutService) {}

    @Post('review')
    @ApiEndpoint({
        summary: 'Review checkout before creating an order',
        body: { type: CheckoutDTO },
        responses: [{ status: 201, description: 'Checkout review calculated' }],
    })
    checkoutReview(@Body() payload: CheckoutDTO){
        return this.checkoutService.checkoutReview(payload)
    }

    @Post('create_order')
    @ApiEndpoint({
        summary: 'Create an order from checkout payload',
        body: { type: CheckoutDTO },
        responses: [{ status: 201, description: 'Order created' }],
    })
    createOrder(@Body() payload: CheckoutDTO){
        return this.checkoutService.createOrderByUser(payload.shopOrderIds, payload.cartId, payload.userId)
    }
}
