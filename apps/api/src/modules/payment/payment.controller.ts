import { Body, Controller, Get, Headers, Param, Post, RawBodyRequest, Req } from '@nestjs/common';
import { Request } from 'express';
import { PaymentService } from './payment.service';
import { CreatePaymentDto, RefundPaymentDto } from './dto/payment.dto';

@Controller('payments')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) {}

    @Post()
    async createPayment(@Body() createPaymentDto: CreatePaymentDto) {
        return this.paymentService.createPaymentIntent(createPaymentDto);
    }

    @Get(':id')
    async getPayment(@Param('id') id: string) {
        return this.paymentService.getPaymentIntent(id);
    }

    @Post('refund')
    async refundPayment(@Body() refundDto: RefundPaymentDto) {
        return this.paymentService.refundPayment(refundDto);
    }

    @Post('customers')
    async createCustomer(@Body() body: { email: string; name?: string; metadata?: Record<string, any> }) {
        return this.paymentService.createCustomer(body.email, body.name, body.metadata);
    }

    @Post('webhook')
    async handleWebhook(
        @Headers('stripe-signature') signature: string,
        @Req() req: any,
    ) {
        return this.paymentService.handleWebhookEvent(signature, req);
    }
}
