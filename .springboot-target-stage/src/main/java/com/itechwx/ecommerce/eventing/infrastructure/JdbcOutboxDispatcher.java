package com.itechwx.ecommerce.eventing.infrastructure;

import com.itechwx.ecommerce.eventing.application.EventPublisher;
import com.itechwx.ecommerce.eventing.config.KafkaEventProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import java.sql.Timestamp;
import java.time.Clock;
import java.util.List;
import java.util.UUID;

public final class JdbcOutboxDispatcher {

    private static final Logger LOGGER = LoggerFactory.getLogger(JdbcOutboxDispatcher.class);

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final TransactionTemplate transactionTemplate;
    private final EventPublisher publisher;
    private final KafkaEventProperties properties;
    private final Clock clock;
    private final String workerId = UUID.randomUUID().toString();

    public JdbcOutboxDispatcher(
            NamedParameterJdbcTemplate jdbcTemplate,
            TransactionTemplate transactionTemplate,
            EventPublisher publisher,
            KafkaEventProperties properties,
            Clock clock
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.transactionTemplate = transactionTemplate;
        this.publisher = publisher;
        this.properties = properties;
        this.clock = clock;
    }

    public int dispatchBatch() {
        List<OutboxRecord> claimed = claimBatch();
        for (OutboxRecord record : claimed) {
            try {
                publisher.publish(record.topic(), record.eventKey(), record.payload());
                markPublished(record.id());
            } catch (RuntimeException exception) {
                releaseForRetry(record.id(), exception);
            }
        }
        return claimed.size();
    }

    private List<OutboxRecord> claimBatch() {
        return transactionTemplate.execute(status -> jdbcTemplate.query("""
                WITH candidates AS (
                    SELECT id
                      FROM domain_event_outbox
                     WHERE available_at <= :now
                       AND (
                            status = 'PENDING'
                            OR (status = 'PUBLISHING' AND locked_at < :staleBefore)
                       )
                     ORDER BY created_at, id
                     LIMIT :batchSize
                     FOR UPDATE SKIP LOCKED
                )
                UPDATE domain_event_outbox event
                   SET status = 'PUBLISHING', locked_at = :now,
                       locked_by = :workerId, updated_at = :nowMillis
                  FROM candidates
                 WHERE event.id = candidates.id
                RETURNING event.id, event.topic, event.event_key, event.payload::text
                """, new MapSqlParameterSource()
                .addValue("now", Timestamp.from(clock.instant()))
                .addValue("staleBefore", Timestamp.from(clock.instant().minus(properties.claimTimeout())))
                .addValue("batchSize", properties.outboxBatchSize())
                .addValue("workerId", workerId)
                .addValue("nowMillis", clock.millis()),
                (resultSet, rowNumber) -> new OutboxRecord(
                        resultSet.getString("id"),
                        resultSet.getString("topic"),
                        resultSet.getString("event_key"),
                        resultSet.getString("payload")
                )));
    }

    private void markPublished(String id) {
        jdbcTemplate.update("""
                UPDATE domain_event_outbox
                   SET status = 'PUBLISHED', published_at = :publishedAt,
                       locked_at = NULL, locked_by = NULL, last_error = NULL,
                       updated_at = :now
                 WHERE id = :id AND status = 'PUBLISHING' AND locked_by = :workerId
                """, new MapSqlParameterSource()
                .addValue("publishedAt", Timestamp.from(clock.instant()))
                .addValue("now", clock.millis())
                .addValue("id", id)
                .addValue("workerId", workerId));
    }

    private void releaseForRetry(String id, RuntimeException exception) {
        String errorType = exception.getClass().getSimpleName();
        jdbcTemplate.update("""
                UPDATE domain_event_outbox
                   SET status = 'PENDING', attempts = attempts + 1,
                       available_at = :availableAt, locked_at = NULL, locked_by = NULL,
                       last_error = :lastError, updated_at = :now
                 WHERE id = :id AND status = 'PUBLISHING' AND locked_by = :workerId
                """, new MapSqlParameterSource()
                .addValue("availableAt", Timestamp.from(clock.instant().plusSeconds(30)))
                .addValue("lastError", errorType)
                .addValue("now", clock.millis())
                .addValue("id", id)
                .addValue("workerId", workerId));
        LOGGER.warn("Outbox publication will be retried event_id={} error_type={}", id, errorType);
    }

    private record OutboxRecord(String id, String topic, String eventKey, String payload) {
    }
}
