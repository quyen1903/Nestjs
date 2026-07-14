# Ecommerce Spring Boot Quick Start

## Prerequisites

```powershell
java --version
.\mvnw.cmd --version
psql --version
```

Use Java 25. Docker is optional for compilation but required for the
PostgreSQL Testcontainers verification.

## Configure local development

Copy `.env.example` into your local secret-management workflow. Spring does
not load `.env` automatically; provide variables through the shell, IDE run
configuration, or an approved secret store. Never commit real credentials.

Required local variables:

```text
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/ecommerce_springboot
SPRING_DATASOURCE_USERNAME=local_user
SPRING_DATASOURCE_PASSWORD=local_password
ECOMMERCE_CORS_ALLOWED_ORIGINS=http://localhost:3000
ECOMMERCE_TOKEN_DIGEST_PEPPER=replace-with-at-least-32-random-characters
ECOMMERCE_PASSWORD_RESET_BASE_URL=http://localhost:3000/reset-password
SPRING_MAIL_HOST=localhost
SPRING_MAIL_PORT=1025
```

Google OAuth is optional and disabled by default. To enable it locally, also
set `GOOGLE_OAUTH_ENABLED=true`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
and the registered callback
`http://localhost:3057/v1/api/auth/auth/google/callback`. Production requires
an HTTPS callback. Never commit provider credentials.

Stripe is optional and disabled by default. Payment routes fail closed with a
safe `503` until `STRIPE_ENABLED=true`, `STRIPE_SECRET_KEY`, and
`STRIPE_WEBHOOK_SECRET` are supplied. `STRIPE_CURRENCY` defaults to `usd`.
Use Stripe test/sandbox credentials locally; never commit them.

Kafka and pending-order expiry are optional and disabled by default. To enable
the migrated notification pipeline, run a Kafka broker and set
`KAFKA_ENABLED=true` plus `KAFKA_BOOTSTRAP_SERVERS`. To enable the expiry job,
set `ORDER_EXPIRATION_JOB_ENABLED=true`. The job uses bounded PostgreSQL
`SKIP LOCKED` batches and supports both Spring order-linked reservations and
legacy NestJS reservation rows.

SMTP health is disabled by default because local password-reset delivery is an
optional downstream service. Set `MAIL_HEALTH_ENABLED=true` only when an SMTP
service is intentionally configured and should affect aggregate health. This
does not disable password-reset delivery or suppress its safe downstream error.

The values above are examples. Use a disposable empty database for the initial
Flyway baseline. Do not point the baseline migration at the existing NestJS
database. Existing databases require the explicit procedure in
[Flyway baseline runbook](docs/migration/FLYWAY_BASELINE_RUNBOOK.md).

## Verify

```powershell
.\mvnw.cmd verify
```

Expected current behavior:

- the project compiles and packages;
- security, error, validation, request-ID, and request-size tests run;
- Docker-backed PostgreSQL tests run only when Docker is available;
- Phase 2 auth, Phase 3 account/catalog, Phase 4 cart/discount/inventory,
  Phase 5 checkout/Stripe, and Phase 6 comment routes are present;
- Kafka notifications and order expiry are opt-in, and all unmatched business
  routes remain denied.

## Run beside NestJS

Start NestJS from the source repository using its existing process. Then start
Spring on its separate port:

```powershell
$env:SPRING_PROFILES_ACTIVE="local"
$env:SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/ecommerce_springboot"
$env:SPRING_DATASOURCE_USERNAME="local_user"
$env:SPRING_DATASOURCE_PASSWORD="local_password"
$env:ECOMMERCE_TOKEN_DIGEST_PEPPER="replace-with-at-least-32-random-characters"
$env:ECOMMERCE_PASSWORD_RESET_BASE_URL="http://localhost:3000/reset-password"
$env:SPRING_MAIL_HOST="localhost"
$env:SPRING_MAIL_PORT="1025"
.\mvnw.cmd spring-boot:run
```

The local URLs are:

```text
NestJS: http://localhost:3056/v1/api
Spring: http://localhost:3057/v1/api
```

## Production safeguards

The `production` profile fails startup when origins are wildcard/local, issuer,
audience, or digest pepper settings are local placeholders, the reset URL is
not HTTPS, or configured origins are not HTTPS. Production uses Hibernate
schema validation and never enables automatic Flyway baselining.

## Troubleshooting

See [HELP.md](HELP.md). Never use destructive Prisma reset or ad-hoc schema
commands on shared data during the dual-run migration.
