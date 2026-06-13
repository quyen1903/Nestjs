// kafka.module.ts
import { Module } from '@nestjs/common';
import { ProducerService } from './services/producer.service';
import { ConsumerService } from './services/consumer.service';
@Module({
    providers:[ProducerService, ConsumerService],
    exports: [ProducerService, ConsumerService],
})
export class KafkaModule {}