// kafka.module.ts
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
    imports: [
        ClientsModule.register([
        {
            name: 'KAFKA_SERVICE',
            transport: Transport.KAFKA,
            options: {
            client: {
                clientId: 'nestjs-app',
                brokers: ['localhost:9092'],
            },
            consumer: {
                groupId: 'nestjs-consumer',
            },
            },
        },
        ]),
    ],
    exports: [ClientsModule],
})
export class KafkaModule {}