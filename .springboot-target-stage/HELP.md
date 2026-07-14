# Spring Boot Migration Help

## Build does not start

Confirm the selected toolchain:

```powershell
java --version
.\mvnw.cmd --version
```

This project requires Java 25. The Maven Wrapper downloads Maven 3.9.11 into
the user's Maven cache on first use.

## PostgreSQL connection failure

Check that `ECOMMERCE_DB_URL` is a JDBC URL and that the username has access to
the disposable target database. Do not print passwords or connection URLs that
contain passwords in tickets or logs.

Spring intentionally uses `ddl-auto: validate`; it will not repair schema
drift. Follow [the Flyway runbook](docs/migration/FLYWAY_BASELINE_RUNBOOK.md).

## Flyway refuses a non-empty schema

This is expected. `baseline-on-migrate` is disabled. Do not turn it on as a
shortcut. Existing databases must be backed up, restored to a disposable
database, explicitly baselined at the recorded version, and validated before
any shared environment is touched.

## PostgreSQL integration test is skipped

`LegacySchemaBaselineTest` uses Testcontainers and is annotated to skip when
no Docker environment exists. Start Docker and rerun:

```powershell
.\mvnw.cmd verify
```

A skipped test is not a passed database migration test.

## Requests return 401 or 403

This is the Phase 1 security posture. Only health and OpenAPI documentation are
public. All business endpoints remain absent and unmatched requests are denied
until the corresponding migration phase adds a verified principal and policy.

## Kafka notifications do not start

Kafka is intentionally disabled unless `KAFKA_ENABLED=true`. Confirm the
broker list in `KAFKA_BOOTSTRAP_SERVERS`, then inspect the outbox and consumer
health without printing payloads containing confidential data. Failed
listener records are retried and then published to the matching `.DLT` topic.
Do not bypass `notification_event_receipts`; it is the durable replay guard.

## Aggregate health is DOWN while liveness and readiness are UP

Local SMTP is optional and normally absent, so its Actuator contributor is
disabled by default with `MAIL_HEALTH_ENABLED=false`. Enable it only when SMTP
is intentionally deployed and should affect aggregate health. Do not disable
the database health contributor to hide a real PostgreSQL failure.

## Pending orders are not expiring

The scheduler is intentionally disabled unless
`ORDER_EXPIRATION_JOB_ENABLED=true`. Enabling it is safe for multiple service
instances: workers claim pending orders with `FOR UPDATE SKIP LOCKED`, and
reservation release is idempotent. Do not run the legacy NestJS cron module as
an assumed equivalent; it is not imported by the NestJS root module.

## NestJS startup repair

The Phase 0 baseline recorded an unresolved
`@prisma/client-runtime-utils` runtime dependency. Phase 7 repaired the source
package boundary by pinning the Prisma packages together and listing the
generated client's runtime package directly. Discord is now opt-in with
`DISCORD_ENABLED=true`; disabled local startup performs no provider connection,
and enabled request telemetry excludes bodies and query values.

Run `pnpm install`, rebuild the API, and start `node dist/main.js`. The source
OpenAPI document is available at `http://localhost:3056/api-docs-json`.

## Port conflict

NestJS uses `3056`; Spring uses `3057`. Override the Spring port locally only:

```powershell
$env:SERVER_PORT="3058"
.\mvnw.cmd spring-boot:run
```

Do not change the documented compatibility prefix `/v1/api`.

## Source documents

The original NestJS documentation is archived under
`docs/legacy/nestjs/source-docs/`. Current implementation claims belong in the
target documents and parity matrices.

## Official references

- [Spring Boot 3.5 reference](https://docs.spring.io/spring-boot/3.5/)
- [Spring Security reference](https://docs.spring.io/spring-security/reference/)
- [Apache Maven guide](https://maven.apache.org/guides/)
- [Testcontainers for Java](https://java.testcontainers.org/)
