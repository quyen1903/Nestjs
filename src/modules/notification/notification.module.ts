import { Module } from '@nestjs/common';
import { NotificationFactoryService } from './services/notification-factory.service';
import { NotificationConsumerService } from './services/notification-consumer.service';
import { KafkaModule } from 'src/services/kafka/kafka.module';
import { DrizzleModule } from 'src/database/drizzle.module';
@Module({
  imports:[KafkaModule, DrizzleModule],
  providers: [NotificationFactoryService, NotificationConsumerService],
  exports: [NotificationFactoryService, NotificationConsumerService]
})
export class NotificationModule {}
