import { Injectable, OnApplicationShutdown, Logger } from "@nestjs/common";
import { Consumer, ConsumerRunConfig, ConsumerSubscribeTopics, Kafka } from "kafkajs";
@Injectable()
export class ConsumerService implements OnApplicationShutdown{
    private readonly logger = new Logger(ConsumerService.name);

    private readonly kafka = new Kafka({
        brokers: ['localhost:9092'],
        retry:{
            initialRetryTime: 300,
            retries: 10
        }
    })

    private readonly consumers: Consumer[] = [];

    async consume(topic: ConsumerSubscribeTopics, config: ConsumerRunConfig, groupId: string = 'nestjs-kafka') {
        try {
            const consumer = this.kafka.consumer({
                groupId,
                sessionTimeout: 30000,
                heartbeatInterval: 3000,
                retry: {
                    initialRetryTime: 300,
                    retries: 10
                },
                allowAutoTopicCreation: true
            });
            
            await consumer.connect();
            this.logger.log(`Consumer connected: ${groupId}`);
            
            await consumer.subscribe({
                ...topic,
                fromBeginning: false // Only consume new messages by default
            });
            this.logger.log(`Subscribed to topics: ${topic.topics.join(', ')}`);
            
            await consumer.run({
                ...config,
                autoCommit: true,
                autoCommitInterval: 5000, // Commit offsets every 5 seconds
                partitionsConsumedConcurrently: 3, // Process multiple partitions in parallel
            });
            
            this.consumers.push(consumer);
            this.logger.log(`Consumer started: ${groupId}`);
            
            // Set up error handler
            consumer.on(consumer.events.CRASH, (event) => {
                this.logger.error(`Consumer crashed: ${event.payload.error.message}`, event.payload.error.stack);
                // You might want to implement auto-restart logic here
            });
            
            return consumer;
        } catch (error) {
            this.logger.error(`Failed to start consumer: ${error instanceof Error? error.message: String(error)}`, 
                error instanceof Error ? error.stack : undefined);
            throw error;
        }
    }

    async onApplicationShutdown() {
        try {
            const disconnectPromises = this.consumers.map(consumer => {
                return consumer.disconnect().catch(error => {
                    this.logger.error(`Error disconnecting consumer: ${error.message}`);
                });
            });
            
            await Promise.all(disconnectPromises);
            this.logger.log(`Disconnected ${this.consumers.length} consumers`);
            this.consumers.length = 0; // Clear the array
        } catch (error) {
            this.logger.error(`Error during consumer shutdown: ${error instanceof Error? error.message: String(error)}`);
        }
    }
}