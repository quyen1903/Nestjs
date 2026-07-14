# Phase 0 Baseline Verification

Captured on 2026-06-29 from the source repository on branch `develop`.
No environment values, tokens, password hashes, or provider secrets were
captured.

| Check | Command | Result |
| --- | --- | --- |
| API typecheck | `pnpm --filter @ecommerce/api typecheck` | PASS |
| API build | `pnpm --filter @ecommerce/api build` | PASS |
| API unit tests | `pnpm --filter @ecommerce/api test -- --runInBand` | PASS: 5 suites, 13 tests; ts-jest emitted pre-existing `allowJs` warnings for generated Prisma JavaScript. |
| Prisma schema validation | `node node_modules/prisma/build/index.js validate` from `apps/api` | PASS |
| Prisma migration state | `node node_modules/prisma/build/index.js migrate status` from `apps/api` | PASS: 3 migrations; local database reported up to date. |
| Nest runtime startup | `node dist/main.js` | FAIL (pre-existing): unresolved `@prisma/client-runtime-utils`; see `evidence/nestjs-startup.stderr.log`. |
| Runtime OpenAPI capture | `GET http://localhost:3056/api-docs-json` | BLOCKED by the source runtime failure. Static controller/DTO evidence is used and all affected rows remain unverified. |
| Local schema snapshot | PostgreSQL 16 `pg_dump --schema-only --no-owner --no-privileges` | PASS: `src/main/resources/db/baseline/local-schema.sql`. The snapshot contains schema only. |
| Toolchain | `node --version`, `pnpm --version`, `java -version`, `mvn -version` | Node 25.2.1, pnpm 11.5.1, Java 25, Maven 3.9.11. |

## Source availability rule

The NestJS repository and migrations remain in place and unmodified. The
service was not listening before Phase 0. A baseline startup attempt failed for
the dependency reason above; the migration does not claim to have caused or
fixed that failure. No source process was terminated for cutover.

## Fixtures

No customer data was exported. Phase 0 fixtures are limited to controller and
DTO examples already present in source documentation. Synthetic executable
fixtures will be added with the corresponding Spring slices.

## Phase 7 recheck - 2026-07-04

- API typecheck/build and all 7 unit suites (15 tests) pass.
- Prisma schema validation and migration status still pass with 3 migrations.
- The frontend typecheck and production build pass.
- An explicit source repair pins all Prisma packages at 7.8.0 and lists
  `@prisma/client-runtime-utils` directly for the custom generated-client
  package boundary. Type-only Express imports remove the next latent runtime
  resolution failure.
- Discord startup is opt-in and safe for local dual-run use. Disabled startup
  makes no provider connection; enabled telemetry excludes request bodies and
  query values.
- `node dist/main.js` starts on port 3056. Its live OpenAPI document contains
  41 paths and 50 operations.
- Dual-runtime method/path comparison passes with 50 operations on each side,
  zero Nest-only operations, and zero Spring-only operations. The HTML root
  response also matches in status, UTF-8 content type, and body.
- Spring runtime/OpenAPI evidence is recorded separately in
  [PHASE_7_PROGRESS_REPORT.md](PHASE_7_PROGRESS_REPORT.md).
