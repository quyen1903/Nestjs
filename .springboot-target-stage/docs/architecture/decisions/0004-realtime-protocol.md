# ADR-0004: No unverified realtime protocol substitution

- Status: Accepted; product protocol decision deferred
- Date: 2026-07-02

## Context

Socket.IO is listed as a dependency and in documentation, but no gateway or
chat module exists in live source. Spring WebSocket/STOMP is not wire-compatible
with Socket.IO.

## Decision

Do not add STOMP or claim realtime parity. Phase 6 inspection confirmed there
is still no live gateway or frontend consumer to migrate. HTTP/database state
remains the source of truth. A later phase may add realtime only after the owner chooses either a
maintained Socket.IO-compatible server path or a versioned frontend protocol
migration, followed by authentication and channel-authorization tests.

## Consequences

No unsupported client behavior is invented during migration. The dependency
baseline stays smaller and the parity report records realtime as not live.
