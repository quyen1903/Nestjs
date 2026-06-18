import { Body, Controller, Get, Headers, Param, Post, Req, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto, RefundPaymentDto } from './dto/payment.dto';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { RoleGuard } from '../auth/auth-role.guard';
import { Roles } from '../auth/roles.decorator';
import { AccountType } from 'prisma/generated/prisma';
import { AuthRequest } from '../auth/dto/auth-request.dto';
import { JWTdecode } from 'src/shared/interfaces/jwt.interface';

@Controller('payments')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) {}

    @Post()
    @UseGuards(AccessTokenGuard, RoleGuard)
    @Roles(AccountType.USER)
    async createPayment(
        @Body() createPaymentDto: CreatePaymentDto,
        @AuthRequest('account') account: JWTdecode,
    ) {
        return this.paymentService.createPaymentIntent(createPaymentDto, account);
    }

    @Get(':id')
    @UseGuards(AccessTokenGuard, RoleGuard)
    @Roles(AccountType.USER, AccountType.SHOP, AccountType.ADMIN, AccountType.SUPER_ADMIN)
    async getPayment(
        @Param('id') id: string,
        @AuthRequest('account') account: JWTdecode,
    ) {
        return this.paymentService.getPaymentIntent(id, account);
    }

    @Post('refund')
    @UseGuards(AccessTokenGuard, RoleGuard)
    @Roles(AccountType.SHOP, AccountType.ADMIN, AccountType.SUPER_ADMIN)
    async refundPayment(
        @Body() refundDto: RefundPaymentDto,
        @AuthRequest('account') account: JWTdecode,
    ) {
        return this.paymentService.refundPayment(refundDto, account);
    }

    @Post('customers')
    @UseGuards(AccessTokenGuard, RoleGuard)
    @Roles(AccountType.USER)
    async createCustomer(@AuthRequest('account') account: JWTdecode) {
        return this.paymentService.createCustomer(account);
    }

    @Post('webhook')
    async handleWebhook(
        @Headers('stripe-signature') signature: string,
        @Req() req: any,
    ) {
        return this.paymentService.handleWebhookEvent(signature, req.body);
    }
}
