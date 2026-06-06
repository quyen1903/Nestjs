import { Controller } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

@Controller()
@ApiExcludeController()
export class KafkaController {
    async handleMessage(message: any) {
        console.log(`Worker ${process.pid} processing message:`, message);
        return { processed: true, result: 'success' };
    }
}
