// kafka.controller.ts
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class KafkaController {
    @MessagePattern('topic-name')
    async handleMessage(@Payload() message: any) {
        console.log(`Worker ${process.pid} processing message:`, message);
        return { processed: true, result: 'success' };
    }
}