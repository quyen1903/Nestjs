package com.itechwx.ecommerce.eventing.infrastructure;

import org.springframework.scheduling.annotation.Scheduled;

public final class OutboxDispatchJob {

    private final JdbcOutboxDispatcher dispatcher;

    public OutboxDispatchJob(JdbcOutboxDispatcher dispatcher) {
        this.dispatcher = dispatcher;
    }

    @Scheduled(fixedDelayString = "${ecommerce.kafka.outbox-fixed-delay:PT1S}")
    public void dispatch() {
        dispatcher.dispatchBatch();
    }
}
