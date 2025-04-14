import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConsumerService } from 'src/services/kafka/services/consumer.service';
import { NotificationFactoryService } from './notification-factory.service';
import { ProducerService } from 'src/services/kafka/services/producer.service';

@Injectable()
export class NotificationConsumerService implements OnModuleInit {
    private readonly logger = new Logger(NotificationConsumerService.name);

    constructor(
        private readonly consumerService: ConsumerService,
        private readonly notificationFactory: NotificationFactoryService,
        private readonly producerService: ProducerService,
    ) {}

    async onModuleInit() {
        const topics = this.producerService.getTopics();
        
        try {
            // Handle product creation events
            await this.consumerService.consume(
                { topics: [topics.PRODUCT_CREATED] },
                {
                    eachMessage: async ({ topic, partition, message }) => {
                        try {
                            const rawMessage = message.value?.toString();
                            if (!rawMessage) {
                                this.logger.warn('Received empty message');
                                return;
                            }
                            const productData = JSON.parse(rawMessage);
                            await this.notificationFactory.createProductNotification(productData);
                        } catch (error) {
                            this.logger.error(`Error processing product message: 
                                ${error instanceof Error? error.message: String(error)}`, 
                                error instanceof Error? error.stack: undefined
                            );
                        }
                    },
                },
                'product-notification-group'
            );

            // Handle discount creation events
            await this.consumerService.consume(
                { topics: [topics.DISCOUNT_CREATED] },
                {
                    eachMessage: async ({ topic, partition, message }) => {
                        try {
                            const rawMessage = message.value?.toString();
                            if (!rawMessage) {
                                this.logger.warn('Received empty message');
                                return;
                            }
                            
                            const discountData = JSON.parse(rawMessage);
                            await this.notificationFactory.createDiscountNotification(discountData);
                        } catch (error) {
                            this.logger.error(`Error processing discount message: 
                                ${error instanceof Error? error.message: String(error)}}`, 
                                error instanceof Error? error.stack: undefined
                            );
                        }
                    },
                },
                'discount-notification-group'
            );
            
            this.logger.log('Notification consumers started successfully');
        } catch (error) {
            this.logger.error(`Failed to start notification consumers: 
                ${error instanceof Error? error.message: String(error)}`,
                error instanceof Error? error.stack: undefined
            );
        }
    }
}