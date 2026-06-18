import { IsNumber, IsOptional, IsString, IsObject, IsNotEmpty } from 'class-validator';

export class CreatePaymentDto {
    @IsString()
    @IsNotEmpty()
    orderId: string;

    @IsOptional()
    @IsNumber()
    amount?: number;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    customerId?: string;

    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;
}

export class RefundPaymentDto {
    @IsString()
    paymentIntentId: string;

    @IsOptional()
    @IsNumber()
    amount?: number;

    @IsOptional()
    @IsString()
    reason?: string;
}
