import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CreatePaymentDto, RefundPaymentDto } from './dto/payment.dto';

@Injectable()
export class PaymentService {
    private readonly stripe: Stripe;
    private readonly logger = new Logger(PaymentService.name);
    
    private handleStripeError(error: unknown, context = 'Stripe Operation') {
        if (error instanceof Stripe.errors.StripeError) {
          this.logger.error(`[${context}] Stripe error: ${error.message}`, error.stack);
        } else if (error instanceof Error) {
          this.logger.error(`[${context}] Unexpected error: ${error.message}`, error.stack);
        } else {
          this.logger.error(`[${context}] Unknown error`, JSON.stringify(error));
        }
      
        throw error; // Re-throw để giữ nguyên behavior
    }
      
    constructor(private configService: ConfigService) {
        this.stripe = new Stripe(this.configService.get<string>('stripe.secretKey'), {
            apiVersion: '2025-03-31.basil', // Use the latest API version
        });
    }

    /**
     * Create a payment intent
     */
    async createPaymentIntent(paymentDto: CreatePaymentDto) {
        try {
        const { amount, description, customerId, metadata } = paymentDto;
        const currency = paymentDto.currency || this.configService.get<string>('stripe.currency');

        const paymentIntent = await this.stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Stripe uses smallest currency unit (cents)
            currency,
            description,
            customer: customerId,
            metadata,
        });

        return {
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
        };
        } catch (error: unknown) {
            this.handleStripeError(error, 'createPaymentIntent')
        }
          
    }

    /**
     * Get payment intent details
     */
    async getPaymentIntent(paymentIntentId: string) {
        try {
        return await this.stripe.paymentIntents.retrieve(paymentIntentId);
        } catch (error: unknown) {
            this.handleStripeError(error, 'getPaymentIntent')
        }
    }

    /**
     * Process refund for a payment
     */
    async refundPayment(refundDto: RefundPaymentDto) {
        try {
        const { paymentIntentId, amount, reason } = refundDto;
        
        const refund = await this.stripe.refunds.create({
            payment_intent: paymentIntentId,
            amount: amount ? Math.round(amount * 100) : undefined, // If not provided, refund the full amount
            reason: reason as Stripe.RefundCreateParams.Reason,
        });

        return {
            success: true,
            refundId: refund.id,
            status: refund.status,
        };
        } catch (error: unknown) {
            this.handleStripeError(error, 'refundPayment')
        }
    }

    /**
     * Create a customer in Stripe
     */
    async createCustomer(email: string, name?: string, metadata?: Record<string, any>) {
        try {
        const customer = await this.stripe.customers.create({
            email,
            name,
            metadata,
        });

        return {
            success: true,
            customerId: customer.id,
        };
        } catch (error: unknown) {
            this.handleStripeError(error, 'createCustomer')
        }
    }

    /**
     * Handle webhook events from Stripe
     */
    async handleWebhookEvent(signature: string, payload: Buffer) {
        try {
        const webhookSecret = this.configService.get<string>('stripe.webhookSecret');
        const event = this.stripe.webhooks.constructEvent(
            payload, 
            signature, 
            webhookSecret
        );

        this.logger.log(`Processing webhook event: ${event.type}`);

        // Handle specific event types
        switch (event.type) {
            case 'payment_intent.succeeded':
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            this.logger.log(`Payment succeeded: ${paymentIntent.id}`);
            // Here you would add business logic for when a payment succeeds
            break;
            
            case 'payment_intent.payment_failed':
            const failedPayment = event.data.object as Stripe.PaymentIntent;
            this.logger.warn(`Payment failed: ${failedPayment.id}`);
            // Handle payment failure logic
            break;
            
            // Add other event types as needed
            default:
            this.logger.log(`Unhandled event type: ${event.type}`);
        }

        return { received: true };
        } catch (error: unknown) {
            this.handleStripeError(error, 'handleWebhookEvent')
        }
    }
}
