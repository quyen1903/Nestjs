# Migration Risks and Acceptance Evidence

This file converts the legacy issue list into testable migration gates. A risk
is not marked fixed until linked automated evidence exists in the Spring
target. Historical recommendations remain unchanged at
`docs/legacy/nestjs/source-docs/ISSUES_AND_FIXES.md`.

| ID | Risk | Required acceptance evidence | Phase | Status |
| --- | --- | --- | --- | --- |
| R-001 | Unsafe default HTTP exposure | unmatched route denied, explicit public health/OpenAPI only | 1 | VERIFIED |
| R-002 | Credentialed wildcard CORS | allowlist test plus production fail-fast configuration | 1 | VERIFIED_CONFIG_AND_FILTER |
| R-003 | Global oversized request body | request-size rejection test and route-specific future overrides | 1 | VERIFIED |
| R-004 | Sensitive request/error logging | bounded request ID, safe error body, no stack/token/body forwarding | 1 | VERIFIED_FOUNDATION |
| R-005 | Generic error and validation behavior | typed exception and Jakarta validation contract tests | 1 | VERIFIED |
| R-006 | Schema/model drift or destructive replay | verified snapshot, explicit Flyway baseline, disposable PostgreSQL validation | 1/2 | AUTH SCHEMA POSTGRES VERIFIED; restored-snapshot rehearsal pending |
| R-007 | JWT algorithm ambiguity | RS256 only, wrong algorithm/expiry/session/role/key denial tests | 2 | VERIFIED |
| R-008 | Recoverable refresh/reset secrets | digest new secrets, rotation/reuse/revocation and legacy transition tests | 2/7 | COMPATIBILITY-FIRST VERIFIED; raw removal gated by Phase 7 |
| R-009 | Cross-principal access | user policy denied to shop and inverse; explicit admin policy | 2 | AUTH HTTP/POLICY VERIFIED; later resource routes pending |
| R-010 | Cross-user/cross-shop data access | service and black-box negative ownership tests | 3+ | CATALOG/COMMERCE/COMMENT POSTGRES VERIFIED; black-box gate remains |
| R-011 | Unsafe public product projection | projection contract excludes seller/private fields and unpublished data | 3 | VERIFIED |
| R-012 | Client-controlled cart price | authoritative catalog price and cart ownership tests | 4 | POSTGRES VERIFIED |
| R-013 | Discount expiry, limits, scope, and races | valid/expired/over-limit/wrong-shop plus concurrent-use tests | 4 | POSTGRES CONCURRENCY VERIFIED |
| R-014 | Inventory oversell | concurrent last-item reservation proves stock never negative | 4 | POSTGRES CONCURRENCY VERIFIED |
| R-015 | Reservation double release/consume | idempotent state transition and timeout tests | 4/5/6 | POSTGRES STATE/CHECKOUT/EXPIRY VERIFIED |
| R-016 | Floating checkout totals | `BigDecimal` totals and rounding contract fixtures | 5 | POSTGRES VERIFIED |
| R-017 | Partial checkout/order writes | PostgreSQL transaction rollback and failure-compensation tests | 5 | POSTGRES ROLLBACK/COMPENSATION VERIFIED |
| R-018 | Payment webhook replay/signature | exact raw-body signature and durable provider-event idempotency tests | 5 | SIGNATURE/POSTGRES REPLAY VERIFIED |
| R-019 | Refund replay or wrong shop | command idempotency and verified shop/order scope tests | 5 | POSTGRES SCOPE/REPLAY/CUMULATIVE LIMIT VERIFIED |
| R-020 | Comment impersonation/deletion | principal-derived author and cross-user deletion denial tests | 6 | HTTP/POSTGRES VERIFIED |
| R-021 | Duplicate/lost async notifications | typed idempotent consumer and after-commit/outbox evidence | 6 | POSTGRES REPLAY/OUTBOX VERIFIED; broker E2E pending Phase 7 |
| R-022 | Unregistered/non-idempotent cleanup | multi-instance-safe reservation expiry scheduler tests | 6 | POSTGRES MULTI-INSTANCE VERIFIED; activation is opt-in |
| R-023 | Unsupported realtime compatibility claim | explicit protocol/client decision and connection-scope tests | 6 | VERIFIED_NOT_LIVE; future feature requires owner decision |
| R-024 | Premature cutover | dual-backend contract/E2E/security/concurrency evidence and rollback rehearsal | 7 | PENDING |
| R-025 | Legacy password incompatibility or account enumeration | fixed Node 25 Argon2id vector, actor-scoped active lookup, same safe failure, dummy hash | 2 | VERIFIED; provider delivery timing remains operationally monitored |
| R-026 | Password brute force and lock-state disclosure | persistent atomic attempt count, 5-attempt/15-minute lock, generic locked/missing/wrong response | 2 | POSTGRES VERIFIED |

## Phase 1 evidence

`mvnw.cmd verify` currently covers:

- deny-by-default security and the health allow rule;
- compatibility success wrapping and typed validation failure;
- request ID generation/propagation;
- oversized request rejection;
- Flyway baseline validation test definition.

The Flyway Testcontainers test is skipped when Docker is absent. Phase 2 also
records a successful disposable local PostgreSQL 16 execution, so auth mappings
are verified while the restored-snapshot rehearsal remains open. See
[PHASE_1_REPORT.md](docs/migration/PHASE_1_REPORT.md) for exact counts and
commands.

## Phase 2 evidence

`mvnw.cmd verify` executed 50 tests successfully and skipped 9 environment-
gated tests. `LocalPostgresCompatibilityTest` then executed without skips on a
new disposable PostgreSQL database and covered both Flyway migrations, auth
lifecycle concurrency, password reset, and persistent lockout. Exact commands
and scope are in
[PHASE_2_PROGRESS_REPORT.md](docs/migration/PHASE_2_PROGRESS_REPORT.md).

## Phase 4 evidence

`mvnw.cmd verify` executed 62 tests and skipped 11 environment-gated tests.
With the local PostgreSQL fixture enabled, 65 tests executed and only the eight
Docker-only tests were skipped. `LocalPostgresCommerceStateTest` covers
verified-user cart ownership/current prices, cross-shop inventory denial,
concurrent discount exhaustion, concurrent oversell prevention, idempotent
reservation release/consume, and expiry release. Exact scope is in
[PHASE_4_REPORT.md](docs/migration/PHASE_4_REPORT.md).

## Phase 5 evidence

The final suite contains 79 tests. The disposable PostgreSQL run executed all
four local-database suites and skipped only eight Docker-specific tests; the
two configuration-guard tests added afterward passed in the final default
quality gate. `LocalPostgresCheckoutPaymentTest` covers
concurrent checkout replay, transaction rollback after reservation, exact
order association, server amount/currency, success consume, failure release,
late-success and mismatch refunds, refund replay/cumulative limit, and
cross-shop denial. `StripePaymentGatewayTest` proves whitespace-sensitive raw
signature verification. Exact commands and limitations are in
[PHASE_5_REPORT.md](docs/migration/PHASE_5_REPORT.md).

## Phase 6 evidence

The final suite contains 82 tests. The default `mvnw.cmd verify` gate passed
with 13 environment-gated skips. A second run against a new disposable local
PostgreSQL 16 database executed all five local-database suites and passed with
only the eight Docker-specific tests skipped. `LocalPostgresPhase6Test` covers
comment ownership/closure, legacy and versioned event validation, notification
replay/scope, outbox rollback/concurrent publication, and multi-instance order
expiry with exact stock/reservation release. Exact commands and remaining
broker/cutover limitations are in
[PHASE_6_REPORT.md](docs/migration/PHASE_6_REPORT.md).

## Phase 7 progress evidence

API and frontend typecheck/build gates pass, as do the 7 NestJS unit suites
(15 tests), Prisma validation, and migration status. The approved source
runtime repair allows NestJS to start without an eager Discord connection.
The delivered Spring jar passes 83 tests with 13 environment-gated skips,
starts against a disposable PostgreSQL 16 database, and returns aggregate
health HTTP 200/UP. Both runtimes expose the same 41 paths and 50 operations;
the legacy HTML root also matches in status, UTF-8 content type, and body.
Risk R-024 remains open because seeded behavior/token-switch comparisons,
provider/broker E2E checks, frontend live-API flows, backup/restore, and traffic
rollback have not been rehearsed. See
[PHASE_7_PROGRESS_REPORT.md](docs/migration/PHASE_7_PROGRESS_REPORT.md).

## Rules for closing risks

1. Link the test class/method or explicit inspection artifact.
2. Record the exact verification command and result.
3. Include denial and failure paths for auth, ownership, inventory, payment,
   and async behavior.
4. Never infer closure from compilation or a happy-path unit test.
5. Update the relevant API, database, module, and Markdown parity rows at the
   same time.
