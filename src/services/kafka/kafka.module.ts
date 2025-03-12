// kafka.module.ts
import { Module } from '@nestjs/common';
import { ProducerService } from './services/producer.service';
import { ConsumerService } from './services/consumer.service';
import { TestConsumer } from './consumer.spec.kafka';
@Module({
    // imports: [
    //     ClientsModule.register([
    //     {
    //         name: 'KAFKA_SERVICE',
    //         transport: Transport.KAFKA,
    //         options: {
    //         client: {
    //             brokers: ['localhost:9092'],
    //         },
    //         consumer: {
    //             groupId: 'notifications-consumer',
    //         },
    //         },
    //     },
    //     ]),
    // ],
    providers:[ProducerService, ConsumerService, TestConsumer],
    exports: [ProducerService, ConsumerService],
})
export class KafkaModule {}