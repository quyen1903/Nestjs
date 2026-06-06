import { Body, Controller, Get, Headers, Param, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CreatePaymentDto, RefundPaymentDto } from './dto/payment.dto';
import { ApiEndpoint } from 'src/shared/swagger/api-docs.decorator';

@Controller('payments')
@ApiTags('Payment')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) {}

    @Post()
    @ApiEndpoint({
        summary: 'Create a Stripe payment intent',
        body: { type: CreatePaymentDto },
        responses: [{ status: 201, description: 'Payment intent created' }],
    })
    async createPayment(@Body() createPaymentDto: CreatePaymentDto) {
        return this.paymentService.createPaymentIntent(createPaymentDto);
    }

    @Get(':id')
    @ApiEndpoint({
        summary: 'Get Stripe payment intent details',
        params: [{ name: 'id', required: true, example: 'pi_123' }],
    })
    async getPayment(@Param('id') id: string) {
        return this.paymentService.getPaymentIntent(id);
    }

    @Post('refund')
    @ApiEndpoint({
        summary: 'Refund a Stripe payment',
        body: { type: RefundPaymentDto },
        responses: [{ status: 201, description: 'Refund created' }],
    })
    async refundPayment(@Body() refundDto: RefundPaymentDto) {
        return this.paymentService.refundPayment(refundDto);
    }

    @Post('customers')
    @ApiEndpoint({
        summary: 'Create a Stripe customer',
        body: {
            schema: {
                type: 'object',
                required: ['email'],
                properties: {
                    email: { type: 'string', example: 'quinn@example.com' },
                    name: { type: 'string', example: 'Quyen Nguyen' },
                    metadata: { type: 'object', example: { source: 'swagger' } },
                },
            },
        },
        responses: [{ status: 201, description: 'Customer created' }],
    })
    async createCustomer(@Body() body: { email: string; name?: string; metadata?: Record<string, any> }) {
        return this.paymentService.createCustomer(body.email, body.name, body.metadata);
    }

    @Post('webhook')
    @ApiEndpoint({
        summary: 'Handle Stripe webhook event',
        description: 'Stripe calls this endpoint with a signed webhook payload.',
        responses: [{ status: 201, description: 'Webhook received' }],
    })
    async handleWebhook(
        @Headers('stripe-signature') signature: string,
        @Req() req: any,
    ) {
        return this.paymentService.handleWebhookEvent(signature, req);
    }
}
