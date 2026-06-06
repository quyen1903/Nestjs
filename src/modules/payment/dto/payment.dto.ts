import { IsNumber, IsOptional, IsString, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentDto {
    @ApiProperty({ example: 199.99, description: 'Amount in major currency unit' })
    @IsNumber()
    amount: number;

    @ApiPropertyOptional({ example: 'usd' })
    @IsOptional()
    @IsString()
    currency?: string;

    @ApiPropertyOptional({ example: 'Order #10001' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ example: 'cus_123' })
    @IsOptional()
    @IsString()
    customerId?: string;

    @ApiPropertyOptional({ example: { orderId: 'order_123' } })
    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;
}

export class RefundPaymentDto {
    @ApiProperty({ example: 'pi_123' })
    @IsString()
    paymentIntentId: string;

    @ApiPropertyOptional({ example: 50 })
    @IsOptional()
    @IsNumber()
    amount?: number;

    @ApiPropertyOptional({ example: 'requested_by_customer' })
    @IsOptional()
    @IsString()
    reason?: string;
}
