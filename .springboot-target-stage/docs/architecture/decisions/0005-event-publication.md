# ADR-0005: Typed, idempotent, after-commit events

- Status: Accepted
- Date: 2026-07-02

## Context

The NestJS producer publishes product and discount messages, while consumers
parse arbitrary JSON, auto-commit, catch failures, and have no durable
idempotency evidence. Commerce workflows cannot lose or duplicate critical
state because of messaging.

## Decision

Events use versioned typed payloads with event ID, safe scope,
and only necessary data. Consumers validate and persist idempotency evidence
before side effects. Non-critical events publish after commit. Workflows that
require durable delivery use a transactional outbox introduced with a reviewed
schema migration.

## Consequences

Phase 6 implements this decision with `domain_event_outbox` and
`notification_event_receipts`. Kafka remains optional and disabled by default.
The consumer also accepts the source producer's bounded legacy `skuId` shape,
then resolves product/shop authority from PostgreSQL. Notifications never
block commerce transactions, and events never become the source of truth for
stock, orders, or payment.
