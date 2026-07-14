# Ecommerce Spring Boot Backend

## Scope and status

This repository is a strangler-style replacement for the NestJS ecommerce
backend. It preserves the external contract and verified PostgreSQL schema
where safe, while correcting documented security and consistency defects.

Phase 1 implements shared infrastructure. Phase 2 validates legacy RS256 access
tokens against active per-device records, maps explicit principals, and
implements compatibility-first user/shop login, refresh/reuse invalidation,
logout, user password reset, digest shadow writes, and persistent lockout.
Phase 3 adds transactional account creation, verified-email Google OAuth
linking, shop-isolated catalog writes, published-only public projections, and
admin-only category mutation. Phase 4 adds user-scoped carts, server-
authoritative discount calculation, shop-scoped inventory, and transactional
inventory reservations with idempotent release/consume. Phase 5 composes those
controls into transactional checkout and order creation, then adds Stripe
intent/refund commands and exact-body webhook processing with durable replay
and compensation records. Phase 6 migrates the live product-comment routes,
product/discount Kafka notifications through a transactional outbox and
durable consumer receipts, and a multi-instance-safe pending-order expiry
worker. Realtime remains disabled because the NestJS source has no live
gateway or client protocol to preserve. The authoritative status is
[MODULE_PARITY_MATRIX.md](docs/migration/MODULE_PARITY_MATRIX.md).

## Runtime architecture

The target is a package-by-feature modular monolith under
`com.itechwx.ecommerce`:

```text
shared/
  api/             compatibility response envelope
  config/          typed validated configuration and OpenAPI
  error/           safe typed error responses
  observability/   request ID and request-size controls
  security/        deny-by-default HTTP security
auth/              principals, sessions, registration, OAuth, and authorization
customer/          buyer registration API
shop/              seller registration API
catalog/           product, SPU, SKU, category, and brand
cart/              user-owned cart and authoritative product snapshots
discount/          shop-owned policy and server-authoritative quote/consume
inventory/         shop stock and order-linked reservation state machine
checkout/          full-cart review and transactional per-shop order creation
order/             pending/confirmed/cancelled state within checkout/payment
payment/           Stripe gateway, command/event idempotency, compensation
comment/           principal-derived product comments and owned soft delete
eventing/           transactional outbox and Kafka publication
notification/      validated, idempotent product/discount event handling
jobs/               bounded multi-instance pending-order expiry
```

Each feature uses inbound adapters/controllers, application use cases, domain
rules, and outbound persistence/integration adapters as needed. Controllers do
not accept trusted `userId`, `shopId`, role, or permission values from request
bodies.

Architecture decisions are under `docs/architecture/decisions/`.

## HTTP contract

- Compatibility prefix: `/v1/api`
- Spring local port: `3057`
- NestJS dual-run port: `3056`
- Live-compatible success fields: `message`, `statusCode`, `metadata`
- Additive correlation field: `requestId`
- Errors: typed safe body with status, code, message, path, timestamp, and
  request ID; no production stack trace

The complete route inventory, including documented-only routes, is in
[API_PARITY_MATRIX.md](docs/migration/API_PARITY_MATRIX.md).

## Security foundation

The filter chain is stateless and deny-by-default. Public exposure is limited
to health, OpenAPI, and the enumerated Phase 2 auth entry/reset routes. Form login, HTTP Basic, logout UI, request caches, and CSRF
for bearer-only APIs are disabled. Browser origins are allowlisted. Production
configuration rejects wildcard or local origins and local issuer/audience
placeholders.

The Phase 2 access adapter validates the existing RS256 per-device token
contract without enabling the unused HS256 path. It supports the source's
PKCS#1 RSA public-key encoding, enforces token/key expiry, rejects role/session
mismatch, derives permissions from active server records, and prevents the raw
stored refresh token from being used as a bearer access token. The internal
principal types remain explicit: user, shop, admin, and super-admin. See
[auth compatibility ADR](docs/architecture/decisions/0002-auth-token-compatibility.md).

## Database and migrations

PostgreSQL remains authoritative. The verified schema snapshot—not only the
current Prisma model—is the mapping source because migration history and model
names conflict.

- Hibernate never creates or updates shared schemas.
- `ddl-auto: validate` detects mapping drift.
- Flyway owns forward migrations in the Spring target.
- The baseline SQL recreates the verified current schema only in a new empty
  disposable database.
- Existing databases receive explicit Flyway baseline metadata after backup
  and restore rehearsal; `baseline-on-migrate` is disabled.
- Legacy Prisma migration files remain unchanged in the NestJS repository.

Known physical-schema hazards include quoted mixed-case tables, SKU column
name drift, a trailing space in `orders."total_discount "`, legacy floating
money, and reservation uniqueness. See
[DATABASE_PARITY_MATRIX.md](docs/migration/DATABASE_PARITY_MATRIX.md).

## Ecommerce integrity rules

Future phases must retain these gates:

- shop-owned queries include verified `shopId`;
- user-private queries include verified `userId`;
- admin access is explicit;
- money uses `BigDecimal` in Java;
- inventory mutations use an atomic predicate or row lock;
- checkout/order/payment state changes are transactional;
- reservation consume/release and provider webhooks are idempotent;
- non-critical notifications publish after commit and do not block checkout.
- event consumers validate target scope and persist replay evidence atomically;
- scheduled expiry uses bounded row claims and one-way reservation release.

Phase 3 catalog, Phase 4 commerce state, and Phase 5 checkout/payment operations
enforce the listed ownership and authority rules. Documented-only COD and order
history/mutation routes are not represented as live parity.

## Configuration and operations

Configuration is typed under `ecommerce.*`. Profiles are `local`, `test`, and
`production`. Local placeholders are synthetic and production fails fast on
unsafe browser/token configuration.

Request IDs accept only a bounded safe header value and otherwise generate a
UUID. Logs use the request ID but never intentionally log tokens, passwords,
cookies, authorization headers, payment material, or complete request bodies.
The NestJS global Discord request-forwarding middleware is intentionally not
migrated.

Kafka and scheduled order expiry are opt-in. Kafka-disabled catalog/discount
writes do not create a backlog. When enabled, event rows are written inside
the business transaction, published after commit, and may be delivered more
than once; the notification receipt makes the database side effect idempotent.
Realtime is not implemented and HTTP/PostgreSQL remain authoritative.

Actuator exposes health only; health detail is not public. OpenAPI is generated
from the Spring runtime and will be compared with the route matrix as slices
are added.

## Verification

```powershell
.\mvnw.cmd verify
```

Phase reports are under `docs/migration/`. Docker is preferred for repeatable
integration tests; reports also record non-skipped disposable local PostgreSQL
verification when Docker is unavailable.

## Legacy documentation

The original backend document is retained at
`docs/legacy/nestjs/source-docs/BACKEND_DOCUMENTATION.md`. Its performance,
realtime, and production-readiness statements were not treated as evidence
because the source did not substantiate them.
