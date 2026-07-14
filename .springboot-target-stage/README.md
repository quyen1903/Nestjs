# Ecommerce Spring Boot Migration

This repository is the Spring Boot target for the ecommerce API currently
implemented in NestJS at `C:\Users\quyen\Desktop\ecommerce`.

The migration is incremental. The NestJS backend remains the runnable source
service until Phase 7 cutover verification and project-owner approval. Spring
features are not considered compatible until their parity-matrix row links to
verification evidence.

## Current status

- Phase 0: source inventory, discrepancy register, parity matrices, database
  snapshot, sanitized fixtures, and architecture decisions complete.
- Phase 1: Spring foundation complete.
- Phase 2: compatibility-first user/shop login, access authentication, refresh
  rotation/reuse invalidation, logout, password reset, principals, permissions,
  and persistent login lockout complete and PostgreSQL-verified.
- Phase 3: transactional user/shop registration, verified-email Google OAuth
  account linking, shop-isolated product/SPU/SKU/brand behavior, published-only
  public projections, and admin category behavior complete and PostgreSQL-
  verified.
- Phase 4: user-owned carts, server-authoritative pricing, shop-scoped
  discounts/inventory, race-safe discount usage, and idempotent inventory
  reservations complete and PostgreSQL-verified.
- Phase 5: transactional full-cart checkout, per-shop pending orders,
  order-linked reservations, server-authoritative Stripe intents, signed raw
  webhooks, durable replay protection, scoped refunds, and failure
  compensation complete and PostgreSQL-verified. COD remains documented-only.
- Phase 6: principal-derived product comments, owned soft deletion, reliable
  product/discount notification events, durable consumer idempotency, and
  multi-instance-safe order expiry are PostgreSQL-verified. Kafka and the
  scheduler remain opt-in; realtime remains intentionally disabled because no
  live Socket.IO gateway exists to preserve.
- Phase 7 local verification: API/frontend builds pass; NestJS and Spring both
  start locally and expose the same 41 OpenAPI paths and 50 operations. Spring
  health is `UP`, and the legacy HTML root response matches. Seeded behavior,
  token-switch, provider, frontend-live, backup/restore, and rollback gates
  remain before cutover approval.

See [Phase 2 report](docs/migration/PHASE_2_PROGRESS_REPORT.md),
[Phase 3 report](docs/migration/PHASE_3_REPORT.md),
[Phase 4 report](docs/migration/PHASE_4_REPORT.md),
[Phase 5 report](docs/migration/PHASE_5_REPORT.md),
[Phase 6 report](docs/migration/PHASE_6_REPORT.md),
[Phase 7 progress report](docs/migration/PHASE_7_PROGRESS_REPORT.md),
[module parity](docs/migration/MODULE_PARITY_MATRIX.md), and
[API parity](docs/migration/API_PARITY_MATRIX.md) for exact status.

## Foundation

- Java 25 and Spring Boot 3.5.7
- Maven Wrapper
- Spring MVC and Jakarta Validation
- deny-by-default Spring Security filter chain
- PostgreSQL, Hibernate validation, and Flyway
- request IDs, structured safe errors, and bounded request bodies
- springdoc OpenAPI and restricted Actuator health
- JUnit, Spring Security Test, and PostgreSQL Testcontainers
- Spring for Apache Kafka with transactional outbox and durable consumer receipts

Approved dependencies and rationale are maintained in [LIBRARY.md](LIBRARY.md).

## Run the quality gate

```powershell
.\mvnw.cmd verify
```

Docker is needed for the PostgreSQL Testcontainers test. Without Docker, that
test reports `skipped`; this is not database-verification evidence.

## Local endpoints

The Spring service is configured for port `3057` so it can run beside the
NestJS service on port `3056`.

```text
Spring base:  http://localhost:3057/v1/api
Health:       http://localhost:3057/v1/api/actuator/health
OpenAPI JSON: http://localhost:3057/v1/api/v3/api-docs
Swagger UI:   http://localhost:3057/v1/api/swagger-ui.html
NestJS base:  http://localhost:3056/v1/api
```

Only the documented auth, health, and OpenAPI paths are public. Logout is
actor-scoped, all unmatched requests remain denied, and later business routes
are added only with authentication, ownership, contract, and integration tests.

## Documentation

- [Quick start](QUICK_START.md)
- [Backend architecture](BACKEND_DOCUMENTATION.md)
- [API reference](API_REFERENCE.md)
- [Security standard](SECURITY.md)
- [Coding standard](CODING_STANDARDS.md)
- [Migration discrepancy register](docs/migration/DISCREPANCY_REGISTER.md)
- [Cutover and rollback ADR](docs/architecture/decisions/0006-cutover-and-rollback.md)

Untouched source documentation is retained under
`docs/legacy/nestjs/source-docs/`. It is historical evidence, not the target
service's current implementation status.
