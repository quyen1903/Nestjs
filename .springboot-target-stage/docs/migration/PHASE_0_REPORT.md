# Phase 0 Report: Inventory and Baselines

- Date: 2026-06-29
- Source: `C:\Users\quyen\Desktop\ecommerce`
- Requested target: `C:\Users\quyen\Desktop\ecommerce-springboot`
- Phase result: COMPLETE WITH RECORDED SOURCE-RUNTIME LIMITATION

## Outcome

The source architecture, controllers, DTOs, guards, services, repositories,
tests, Prisma model, all migration SQL, verified local PostgreSQL schema, and
frontend API consumers were inventoried. The NestJS source remains intact.

Phase 0 created:

- discrepancy, Markdown, module, API, database, dependency, and
  Prisma-to-Java mapping matrices;
- six architecture decisions covering layout, auth compatibility,
  persistence/Flyway, realtime, events, and cutover/rollback;
- a schema-only local PostgreSQL snapshot;
- sanitized representative contract fixtures;
- exact source verification results.

## Parity rows completed

No business route is marked complete. Inventory rows are marked only as
`INVENTORIED`, `SNAPSHOT_VERIFIED`, planned, stubbed, or requiring an
intentional security break. This is deliberate: automated Spring and
black-box comparison evidence does not exist yet.

## Security and data-integrity decisions

- Preserve `/v1/api` and the live success envelope during parity.
- Verify legacy per-device RS256 tokens; do not enable HS256 fallback.
- Derive actor identity from verified authentication, including comments.
- Store new reusable secrets as digests and plan legacy-token transition.
- Do not migrate the Discord request-body forwarding middleware.
- Use explicit database mappings and preserve the verified schema.
- Use `BigDecimal` for Java commerce calculations without silently converting
  legacy columns.
- Keep row locking/atomic inventory predicates and add durable payment/event
  idempotency before parity completion.

## Commands and results

See `BASELINE_VERIFICATION.md`. Source typecheck, build, all 13 unit tests,
Prisma validation, migration status, and local schema capture passed. Nest
runtime startup failed before Spring changes because a generated Prisma runtime
dependency is unresolved. Consequently runtime OpenAPI capture remains open.

## Open risks

- Actual auth route nesting and generated OpenAPI require runtime capture.
- Prisma `Sku.stock/attributes` do not match verified columns `num/skuAttribute`.
- The order discount column has a trailing space in its physical name.
- Discount uniqueness and reservation uniqueness differ from some service
  assumptions.
- Existing raw reusable secrets need a compatibility transition.
- No live realtime gateway exists despite documentation.

## Phase 1 entry gate

Phase 1 may create only foundation endpoints. The Spring filter chain must deny
by default before any business controller is introduced. Hibernate must
validate rather than create shared schema. Business parity remains pending.

