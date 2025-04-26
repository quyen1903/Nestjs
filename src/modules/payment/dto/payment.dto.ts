export class CreatePaymentDto {
    amount: number;
    currency?: string;
    description?: string;
    customerId?: string;
    metadata?: Record<string, any>;
  }
  
  export class RefundPaymentDto {
    paymentIntentId: string;
    amount?: number;
    reason?: string;
  }