// some.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class SomeService {
    constructor(@Inject('KAFKA_SERVICE') private kafkaClient: ClientKafka) {}

    async onModuleInit() {
        // register consumer topics 
        this.kafkaClient.subscribeToResponseOf('topic-name');
        await this.kafkaClient.connect();
    }

    async sendMessage(message: any) {
        // send message to kafka
        return this.kafkaClient.emit('topic-name', message);
    }

    // send message and wait for response
    async processTask(message: any) {
        return this.kafkaClient.send('topic-name', message);
    }
}