import { Injectable, Logger } from "@nestjs/common";

type ProducerRecord = {
    topic: string;
    messages: Array<{
        key?: string;
        value: string | Buffer | null;
        headers?: Record<string, string | Buffer>;
    }>;
};

@Injectable()
export class ProducerService {
    private readonly logger = new Logger(ProducerService.name);

    private readonly applicationTopics = {
        PRODUCT_CREATED: 'product-created',
        DISCOUNT_CREATED: 'discount-created',
    };

    async produce(record: ProducerRecord) {
        this.logger.debug(`Event skipped while Kafka is disabled: ${record.topic}`);
    }

    getTopics() {
        return this.applicationTopics;
    }
}
