import { Injectable, Logger } from "@nestjs/common";

type ConsumerSubscribeTopics = {
    topics: string[];
    fromBeginning?: boolean;
};

type ConsumerRunConfig = {
    eachMessage?: (payload: any) => Promise<void> | void;
};

@Injectable()
export class ConsumerService {
    private readonly logger = new Logger(ConsumerService.name);

    async consume(topic: ConsumerSubscribeTopics, _config: ConsumerRunConfig, groupId: string = 'nestjs-kafka') {
        this.logger.debug(
            `Consumer skipped while Kafka is disabled: ${groupId} (${topic.topics.join(', ')})`,
        );
        return null;
    }
}
