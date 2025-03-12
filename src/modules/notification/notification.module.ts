import { Module } from '@nestjs/common';
import { NotificationFactoryService } from './services/notification-factory.service';
import { NotificationConsumerService } from './services/notification-consumer.service';
import { KafkaModule } from 'src/services/kafka/kafka.module';
import { PrismaModule } from 'src/services/prisma/prisma.module';
@Module({
  imports:[KafkaModule, PrismaModule],
  providers: [NotificationFactoryService, NotificationConsumerService],
  exports: [NotificationFactoryService, NotificationConsumerService]
})
export class NotificationModule {}
