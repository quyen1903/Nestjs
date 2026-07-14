# Phase 1 - Spring Foundation Report

Date: 2026-06-29

## Outcome

The Spring Boot foundation builds as an executable jar and denies business
access by default. No business controller was added. The NestJS source
repository, migrations, and frontend remain available and unchanged for
dual-run/cutover work.

## Implemented

- Maven Wrapper using Maven 3.9.11, Java 25, and Spring Boot 3.5.7.
- Approved dependencies recorded in `LIBRARY.md` and `pom.xml`.
- `local`, `test`, and `production` profile configuration with typed validated
  `ecommerce.*` properties.
- Production fail-fast checks for insecure browser origins and local token
  identity settings.
- PostgreSQL datasource, Hibernate `validate`, Flyway validation, and explicit
  no-automatic-baseline policy.
- Current-schema baseline for new empty disposable databases, generated from
  the Phase 0 schema-only snapshot.
- Stateless deny-by-default Spring Security; public health/OpenAPI paths only.
- CORS allowlist, safe security headers, bounded request bodies, request IDs,
  MDC cleanup, safe typed errors, Jakarta validation, and compatibility success
  envelopes.
- Restricted Actuator health and springdoc OpenAPI.
- JUnit, MockMvc, Spring Security Test, and PostgreSQL Testcontainers
  infrastructure.
- Target documentation rewritten while untouched NestJS documents remain
  archived.

## Security and data-integrity decisions

- The unsafe global Discord request-body forwarding behavior is not migrated.
- Wildcard credentialed CORS and the global 50 MB body limit are not preserved.
- Unmatched routes are denied for anonymous and authenticated requests.
- Production does not use `baseline-on-migrate` or Hibernate schema mutation.
- The baseline DDL is new-empty-database only. Existing databases use explicit
  metadata baselining after backup/restore and drift validation.
- No JWT acceptance path exists in Phase 1; token compatibility is a Phase 2
  owner decision and test gate.

## Verification

Final command:

```powershell
.\mvnw.cmd verify
```

Result: `BUILD SUCCESS`; 14 tests, 0 failures, 0 errors, 1 skipped. The 13
executed tests passed. PostgreSQL Testcontainers requires Docker; this
environment had no valid Docker endpoint, so `LegacySchemaBaselineTest` was
skipped and is not reported as passed.

Source baseline evidence remains in `BASELINE_VERIFICATION.md`: NestJS
typecheck, build, 5 suites/13 tests, Prisma validation, migration status, and
schema-only snapshot passed. NestJS runtime startup was already blocked by its
unresolved Prisma runtime dependency.

## Parity rows completed

- Shared HTTP foundation: implemented and covered by foundation tests.
- Build/profiles/configuration/dependency foundation: implemented.
- PostgreSQL/Flyway integration: implemented; Docker-backed execution evidence
  remains pending because the test was skipped.
- No auth or ecommerce business row is marked complete.

## Residual risks

- Run the PostgreSQL Testcontainers baseline test with Docker and archive a
  non-skipped result before database foundation is fully verified.
- Runtime OpenAPI comparison with NestJS remains blocked by the recorded source
  startup failure.
- Phase 2 cannot finalize refresh/session compatibility without the project
  owner's transition decision because raw legacy secrets and existing tokens
  are involved.

## Next safe slice

Phase 2 begins with principal/session persistence mappings and token contract
fixtures. Before emitting or rewriting reusable tokens, obtain the owner choice
recorded in the discrepancy register.
