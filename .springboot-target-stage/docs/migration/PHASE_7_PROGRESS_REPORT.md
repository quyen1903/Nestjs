# Phase 7 Progress Report - Dual Runtime and Contract Gates

Date: 2026-07-04

## Outcome

The locally executable build, frontend, database, runtime, and route-inventory
gates pass. NestJS and Spring both start, expose 41 OpenAPI paths and 50 HTTP
operations, and have no method/path difference after normalizing the shared
`/v1/api` prefix. Spring aggregate health is `UP`.

The legacy `GET /v1/api/` response is also compatible: both runtimes return
HTTP 200, UTF-8 HTML, and the same body. Spring keeps HTML outside the JSON
success envelope.

Phase 7 is not complete and no traffic cutover is approved. Equivalent seeded
business behavior, existing-token traffic switching, external-provider checks,
frontend live-API flows, restored-snapshot reconciliation, and rollback
rehearsal remain open.

## Executed gates

| Gate | Result |
| --- | --- |
| NestJS dependency install | PASS: supply-chain policy check passed; pinned Prisma packages already present |
| NestJS API typecheck | PASS: `pnpm --filter @ecommerce/api typecheck` |
| NestJS API build | PASS: `pnpm --filter @ecommerce/api build` |
| NestJS API unit tests | PASS: 7 suites, 15 tests |
| Prisma schema validation | PASS |
| Prisma migration status | PASS: 3 migrations; local schema up to date |
| Frontend typecheck/build | PASS from the earlier Phase 7 gate |
| Delivered Spring clean build | PASS: 83 tests, 0 failures/errors, 13 environment-gated skips |
| Spring runtime migration | PASS: all 4 Flyway migrations validated on disposable PostgreSQL 16 |
| Spring aggregate health | PASS: HTTP 200, `UP`; liveness/readiness groups present |
| NestJS generated OpenAPI | PASS: 41 paths, 50 operations |
| Spring generated OpenAPI | PASS: 41 paths, 50 operations |
| Dual OpenAPI method/path comparison | PASS: Nest-only 0, Spring-only 0 |
| Legacy root black-box comparison | PASS: HTTP status, UTF-8 HTML content type, and body match |

The disposable Spring runtime database and probe processes were removed after
verification. No environment value or provider secret was recorded.

## Source runtime repair

The Phase 0 failure came from the custom Prisma generated-client output
importing `@prisma/client-runtime-utils` from the API package boundary while
pnpm exposed it only inside Prisma's virtual dependency directory.

The approved Phase 7 source repair:

- pins `@prisma/adapter-pg`, `@prisma/client`,
  `@prisma/client-runtime-utils`, and `prisma` at 7.8.0;
- lists the runtime package directly in the API dependencies;
- converts Express request/response imports to type-only imports;
- removes full OAuth request logging;
- makes Discord opt-in with `DISCORD_ENABLED=true`;
- prevents disabled startup from connecting to Discord;
- limits enabled request telemetry to method, path, and request ID;
- adds regression tests for disabled startup and sensitive-field exclusion.

This repair changes no ecommerce API, ownership, money, inventory, order, or
payment semantics.

## Spring compatibility correction

The first dual-runtime comparison found one route difference: NestJS exposed
`GET /v1/api/` and Spring did not. Spring now serves the same packaged legacy
HTML through an explicit public controller. `SuccessEnvelopeAdvice` wraps JSON
responses only, so HTML is not converted into a JSON envelope.

`FoundationSecurityTest` verifies the public allow rule, request ID header,
HTML content type, expected body marker, and absence of a JSON envelope.

## Contract evidence

The live method/path comparison produced:

```text
DUAL_RUNTIME_NEST_OPS=50 SPRING_OPS=50
NEST_ONLY=0 SPRING_ONLY=0 SPRING_HEALTH=UP
```

The root response comparison produced:

```text
ROOT_NEST_STATUS=200 SPRING_STATUS=200
NEST_CONTENT_TYPE=text/html; charset=utf-8
SPRING_CONTENT_TYPE=text/html;charset=UTF-8
NEST_LENGTH=4331 SPRING_LENGTH=4331 BODY_MATCH=True
```

This proves runtime route-inventory parity and the root response contract. It
does not substitute for seeded request/response comparison of authenticated
and commerce workflows.

## Remaining gates

- Restore a reviewed synthetic/local snapshot and rehearse backup, migration,
  rollback, and reconciliation. No unclassified database data should be copied.
- Run equivalent seeded requests against both backends and compare normalized
  status, headers, envelopes, errors, pagination, and schemas.
- Verify existing access/refresh tokens across a reversible traffic switch.
- Run real Google, Stripe sandbox, and Kafka broker E2E checks with approved
  non-production credentials and infrastructure.
- Exercise the frontend in live API mode, especially auth, catalog, cart,
  checkout, payment, and seller flows; explicit mock/TODO adapters remain.
- Compare bounded query counts and latency for critical workflows.
- Rehearse gateway traffic switch and rollback, then obtain project-owner
  approval. NestJS source and raw compatibility-token columns remain intact.
