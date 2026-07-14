# Phase 6 Report - Comments, Events, Notifications, and Scheduled Expiry

Date: 2026-07-04

## Outcome

Phase 6 migrates the three live product-comment routes, the product/discount
notification flow, and pending-order expiration. Comment identity and
ownership defects are corrected, asynchronous database effects are replay-safe,
and order expiry is safe across concurrent application instances.

Source inspection found no live Socket.IO gateway, chat module, or frontend
consumer. Realtime therefore remains intentionally disabled under ADR-0004;
Spring WebSocket/STOMP is not represented as compatible behavior.

## Implemented

- `POST /comment` remains USER-only and accepts the legacy request shape, but
  ignores `commentUserId` as authority and derives the author from the verified
  principal.
- Comment creation validates an active published product and a same-product,
  active parent. Closure rows are written in the same transaction.
- `GET /comment` returns the active root or direct-child projection with a
  bounded safe author view.
- `DELETE /comment` requires the verified author and writes a tombstone only
  for that author's selected comment; descendant authors and content are not
  modified.
- Product and discount creation write versioned events through a transactional
  outbox when Kafka is enabled. No broker call occurs inside the business
  transaction.
- Concurrent outbox workers claim rows with `FOR UPDATE SKIP LOCKED`; successful
  publication is recorded once and failed rows retain bounded retry evidence.
- Notification consumers validate topic, event identity, payload hash, target,
  and shop/product scope from PostgreSQL. The bounded legacy `skuId` payload is
  supported without trusting its name or scope fields.
- `notification_event_receipts` makes notification creation idempotent and
  rejects reuse of an event ID with a different topic or payload.
- The opt-in order-expiration job locks pending orders with `SKIP LOCKED`,
  releases order-linked or legacy reservations exactly once, restores stock,
  and moves the order to `CANCELLED` in one transaction.

## Schema migration

`V20260702000200__add_reliable_events.sql` is additive:

- comment lookup and closure indexes;
- `domain_event_outbox` with dispatch/lease state;
- `notification_event_receipts` with event ID, payload hash, result count, and
  processing state.

NestJS ignores these additions. No legacy row or column is removed, renamed,
or reinterpreted.

## Security and data-integrity decisions

- Client-supplied comment identity is retained only for request compatibility;
  it is never used for authorization or persistence authority (D-006).
- Event payloads cannot choose notification sender, recipient, product, shop,
  or discount authority; those values are resolved from persisted state.
- Events and scheduled jobs are opt-in and disabled by default. Enabling Kafka
  or the scheduler requires explicit environment configuration.
- Notification delivery is non-critical and never blocks the catalog or
  discount transaction.
- No unverified realtime protocol or client behavior is introduced (D-014).
- The source cleanup module's non-registration is preserved as a documented
  discrepancy; Spring activation is explicit and its implementation is
  multi-instance/idempotency tested (D-018).

## Verification

Final default staging quality gate:

```text
.\mvnw.cmd verify
Tests run: 82, failures: 0, errors: 0, skipped: 13
BUILD SUCCESS
```

The 13 skips are environment-gated local PostgreSQL and Docker suites. The
complete suite was then run against a newly created disposable PostgreSQL 16
database; the fixture was removed after the run:

```text
mvn.cmd test  (MIGRATION_TEST_DB_* points to the disposable fixture)
Tests run: 82, failures: 0, errors: 0, skipped: 8
BUILD SUCCESS
```

The eight remaining skips are Docker-only tests. All five local PostgreSQL
suites executed. `LocalPostgresPhase6Test` proves comment ownership/closure,
legacy and versioned event validation, notification replay, invalid shop scope,
outbox rollback, concurrent single publication, concurrent order expiry,
legacy and order-linked reservation release, stock restoration, and repeated
expiry safety. `CommentControllerSecurityTest` proves USER-only access and that
a forged legacy author field is ignored.

The shared-database run also exposed and corrected two integration-test
isolation defects: the auth suite now expects all four Flyway migrations, and
Phase 6 assertions scope their expiry/notification evidence rather than
assuming an otherwise empty fixture.

## Remaining gates

- A real Kafka broker publish/consume/DLT run remains a Phase 7 environment
  gate. Database outbox and consumer idempotency are verified independently.
- Black-box response/OpenAPI comparison awaits a runnable NestJS instance; its
  unchanged startup still has the recorded Prisma runtime dependency failure.
- Restored-snapshot migration validation, frontend integration, production-like
  observability, traffic switch, and rollback rehearsal remain Phase 7 gates.
- Realtime is not a live parity gap. Any future realtime feature requires an
  owner-approved Socket.IO-compatible or versioned client protocol and explicit
  connection/channel authorization tests.
