import { Injectable, OnApplicationShutdown, OnModuleInit, Logger } from "@nestjs/common";
import type { Admin, Producer, ProducerRecord } from "kafkajs";
import { KAFKA_BROKERS, KAFKA_ENABLED } from "src/app.config";
@Injectable()
export class ProducerService implements OnModuleInit, OnApplicationShutdown{
    private readonly logger = new Logger(ProducerService.name);

     // Enable auto topic creation at producer level
    private producer?: Producer;
    private admin?: Admin;
    // Add more topics as application grows
    private readonly applicationTopics = {
        PRODUCT_CREATED: 'product-created',
        DISCOUNT_CREATED: 'discount-created',
    };

    async onModuleInit() {
        if (!KAFKA_ENABLED) {
            return;
        }

        try {
            const { Kafka } = await import("kafkajs");
            const kafka = new Kafka({
                brokers: KAFKA_BROKERS,
                retry:{
                    initialRetryTime: 100,
                    retries: 8
                }
            });

            this.producer = kafka.producer({
                allowAutoTopicCreation: true,
                transactionTimeout: 30000
            });
            this.admin = kafka.admin();

            await this.producer.connect();
            await this.admin.connect();
            
            // Create all application topics during startup
            await this.createTopics(Object.values(this.applicationTopics));
            this.logger.log('Kafka producer initialized successfully');
        } catch (error:any) {
            this.logger.error(`Failed to initialize Kafka producer: ${error.message}`, error.stack);
            // Consider whether you want to rethrow or handle gracefully
        }
    }

    async createTopics(topics: string[]) {
        if (!KAFKA_ENABLED) return;
        if (!this.admin) throw new Error('Kafka admin is not initialized');

        try {
            const existingTopics = await this.admin.listTopics();
            
            // Filter out topics that already exist
            const topicsToCreate = topics.filter(topic => !existingTopics.includes(topic));
            
            if (topicsToCreate.length === 0) {
                this.logger.log('All required topics already exist');
                return;
            }
            
            await this.admin.createTopics({
                topics: topicsToCreate.map(topic => ({
                    topic,
                    numPartitions: 3,      // Increased for better parallelism
                    replicationFactor: 1,  // Keep 1 for local development, increase for production
                    configEntries: [
                        { name: 'retention.ms', value: '604800000' }  // 7 days retention
                    ]
                })),
                timeout: 10000, // 10 seconds timeout
            });
            this.logger.log(`Topics created: ${topicsToCreate.join(', ')}`);
        } catch (error) {
            if (typeof error === 'object' && error !== null && 'type' in error && (error as any).type === 'TOPIC_ALREADY_EXISTS') {
                this.logger.log('Topics already exist, continuing...');
                return;
            }
            this.logger.error(`Error creating topics: ${error instanceof Error ? error.message : error}`, error);
            throw error;
        }
    }
    async produce(record: ProducerRecord) {
        if (!KAFKA_ENABLED) {
            return;
        }
        if (!this.producer) throw new Error('Kafka producer is not initialized');

        try {
            await this.producer.send(record);
            this.logger.debug(`Message sent to topic: ${record.topic}`);
        } catch (error) {
            this.logger.error(`Failed to send message to topic ${record.topic}: ${error instanceof Error ? error.message : String(error)}`
                , error instanceof Error ? error.stack : undefined);
            throw error;
        }
    }

    getTopics() {
        return this.applicationTopics;
    }


    async onApplicationShutdown() {
        if (!KAFKA_ENABLED) return;

        try {
            await this.producer?.disconnect();
            await this.admin?.disconnect();
            this.logger.log('Kafka producer disconnected');
        } catch (error) {
            this.logger.error(`Error during Kafka producer shutdown: ${error instanceof Error? error.message: String(error)}`);
        }
    }

}
