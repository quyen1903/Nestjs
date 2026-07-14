# NestJS To Spring Boot Migration Prompt

Copy the prompt below into the coding agent for the new Spring Boot project.
Replace the target path if the Spring project will live outside this repository.

```text
You are the lead migration engineer for an ecommerce platform. Migrate the
existing NestJS backend to Spring Boot while preserving the product behavior,
API compatibility, security boundaries, data integrity rules, and engineering
conventions documented in the source repository.

Source repository:
C:\Users\quyen\Desktop\ecommerce

Source backend:
C:\Users\quyen\Desktop\ecommerce\apps\api

Frontend that must remain compatible:
C:\Users\quyen\Desktop\ecommerce\apps\web

Target Spring Boot project:
<TARGET_PROJECT_PATH>

Existing target scaffold, if this repository is used as the target:
- Maven Wrapper
- Spring Boot 3.5.7
- Java 25
- groupId: com.itechwx
- artifactId: ecommerce

Do not silently change those target versions. If a different Java or Spring
Boot version is necessary, explain why, verify compatibility, and record the
decision in LIBRARY.md and an architecture decision record before changing it.

## Objective

Produce a behavior-compatible Spring Boot backend that can replace the NestJS
API without weakening any documented convention. Treat this as a controlled
migration, not a rewrite and not an opportunity to add unrelated features.

Keep the Next.js frontend unchanged unless a compatibility defect cannot be
handled safely in the backend. Preserve the PostgreSQL data and public API.
Keep the NestJS application available until parity, migration, rollback, and
cutover checks pass.

## Mandatory read order

Before making implementation decisions, read these source files completely in
this order:

1. AGENTS.md
2. SECURITY.md
3. LIBRARY.md
4. CODING_STANDARDS.md
5. README.md
6. QUICK_START.md
7. BACKEND_DOCUMENTATION.md
8. API_REFERENCE.md
9. ISSUES_AND_FIXES.md
10. HELP.md
11. apps/api/src/API_REFERENCE.md
12. apps/web/README.md
13. apps/api/package.json
14. apps/api/src/app.module.ts
15. apps/api/src/main.ts
16. every relevant controller, DTO, guard, decorator, interceptor, filter,
    service/use case, repository, event consumer, scheduler, and test
17. apps/api/prisma/schema.prisma and every existing migration SQL file
18. frontend API clients and schemas that consume the affected endpoints

When graphify-out/graph.json exists, begin codebase discovery with focused
`graphify query`, `graphify explain`, and `graphify path` commands as instructed
by AGENTS.md. Use graph output for navigation, then verify behavior in source,
tests, migrations, and documentation.

Never print .env contents, tokens, credentials, password hashes, private keys,
or other secrets while inspecting either project.

## Source-of-truth and conflict policy

Use the source-of-truth order in CODING_STANDARDS.md. In particular:

1. Explicit project-owner instructions
2. SECURITY.md
3. Product and requirement documents
4. Architecture documents
5. Test cases
6. Current module implementation
7. LIBRARY.md
8. Personal preference

The Markdown documents contain both durable conventions and some stale or
conflicting implementation descriptions. Preserve their intent, but do not
blindly reproduce defects or false claims. Before implementation, create
`docs/migration/DISCREPANCY_REGISTER.md` with each conflict, the evidence, the
applicable source-of-truth priority, the compatibility impact, and the chosen
resolution. Do not resolve security-sensitive or externally visible ambiguity
silently.

Known discrepancies that must be verified rather than assumed:

- main.ts uses `/v1/api`, while some API documentation says `/api`.
- The live success interceptor returns `message`, `statusCode`, and `metadata`,
  while API examples use `code`, `message`, and `data`, and the coding standard
  proposes another stable typed error format.
- Security/coding docs describe JWT subjects through `sub` and explicit
  principal roles, while the current guard also expects `accountId` and
  `deviceId` and resolves per-session key material.
- LIBRARY.md describes NestJS/Fastify/Drizzle in places, but the live backend
  uses NestJS/Express/Prisma; the Spring target must replace only the backend
  portions and retain applicable frontend/infrastructure standards.
- Some documented routes do not match live controller routes or may not yet be
  implemented.
- Prisma schema declarations, generated migrations, and the actual PostgreSQL
  schema may differ. Existing migration SQL and a schema snapshot from a safe
  local/test database are stronger evidence than assumptions from model names.
- Socket.IO and Spring WebSocket/STOMP are not wire-compatible. Do not claim
  realtime parity without an explicit protocol decision and client test.

Where an existing insecure behavior conflicts with SECURITY.md, fix it in the
Spring implementation and document the intentional compatibility break. Add a
negative regression test. Security rules are not negotiable for parity.

## Markdown preservation contract

All existing Markdown conventions must survive the migration. Copy the
documents into the target before adapting them. Do not delete a rule merely
because its example is written in TypeScript.

For every Markdown file, classify each section as one of:

- unchanged durable product/security/domain convention;
- Java/Spring translation of the same convention;
- frontend convention retained unchanged;
- legacy NestJS operational instruction archived with a link;
- corrected stale statement, with evidence and migration note;
- out of scope but retained for future use.

Apply these rules:

- Keep the read order `AGENTS.md -> SECURITY.md -> LIBRARY.md ->
  CODING_STANDARDS.md` and repair all related links.
- Keep SECURITY.md controls at least as strict as they are now. Translate code
  examples to Java only when useful; never weaken the rule behind an example.
- Update LIBRARY.md with an approved Java/Spring backend stack and dependency
  rationale. Retain applicable frontend, PostgreSQL, Redis, Kafka, Stripe,
  object-storage, observability, and infrastructure rules. Do not add a Java
  dependency without documenting it there.
- Add Java/Spring counterparts to CODING_STANDARDS.md for controllers,
  validation, application services, domain policies, repository interfaces,
  persistence adapters, transactions, security, configuration, testing, and
  naming. Retain frontend and ecommerce-domain standards.
- Update README.md, QUICK_START.md, HELP.md, and backend documentation with
  Maven commands, application profiles, local setup, migration workflow, and
  rollback instructions.
- Preserve API_REFERENCE.md as an external contract, but reconcile it against
  live routes and frontend clients. Mark planned/unimplemented endpoints
  honestly. Do not claim parity without a passing contract test.
- Turn ISSUES_AND_FIXES.md items into migration acceptance tests. Update issue
  status only with implementation and verification evidence.
- If duplicate API references are consolidated, leave a short forwarding file
  at the old path so links do not break.
- Preserve the graphify section in AGENTS.md when graphify remains available.
  After code changes, run `graphify update .` from the appropriate project root.

Create `docs/migration/MARKDOWN_PARITY_MATRIX.md` with columns:

`Source file | Target file | Sections retained | Spring adaptations | Intentional corrections | Evidence`

## Architecture to preserve

Use a modular monolith organized by ecommerce capability, not a package tree
organized only by technical layer. Preserve these bounded contexts:

- auth and key-token/session management
- user/customer
- shop/seller
- catalog: product, SPU, SKU, brand, category
- inventory and reservations
- cart
- checkout and pricing review
- order
- payment
- discounts/coupons
- comments/reviews
- notifications
- scheduled order/reservation cleanup
- shared infrastructure such as database, Kafka, email, Discord, request IDs,
  exception mapping, and OpenAPI

Use package-by-feature with explicit internal layers, for example:

src/main/java/com/itechwx/ecommerce/
  EcommerceApplication.java
  auth/
    api/
    application/
    domain/
    infrastructure/
  catalog/
    api/
    application/
    domain/
    infrastructure/
  inventory/
  cart/
  checkout/
  order/
  payment/
  discount/
  comment/
  notification/
  shared/
    config/
    error/
    security/
    observability/

Keep dependencies directed inward:

HTTP request
  -> Spring MVC controller
  -> Jakarta Validation request DTO
  -> Spring Security authentication/authorization
  -> application use case
  -> domain policy/calculator
  -> repository port
  -> JPA/JDBC adapter or external provider adapter

Rules:

- Controllers are thin and never contain database, Redis, Stripe, inventory,
  discount, or authorization shortcuts.
- Application use cases own workflow and transaction boundaries.
- Domain policies are plain Java and do not depend on Spring, JPA, HTTP, Redis,
  Kafka, or Stripe.
- Repository interfaces are domain-shaped. Implementations contain persistence
  details.
- Do not expose JPA entities from controllers.
- Prefer immutable request/response records and explicit mappers.
- Avoid Lombok unless explicitly approved and documented in LIBRARY.md.
- Do not create generic `utils`, `helpers`, or catch-all `services` packages.
- Do not introduce microservices during this migration.

## Required NestJS-to-Spring translation

Translate responsibilities, not decorator syntax:

| NestJS concept | Spring Boot equivalent |
| --- | --- |
| Module by capability | Package/module by capability with constructor injection |
| Controller decorators | Spring MVC mappings |
| DTO + class-validator | Request records/classes + Jakarta Bean Validation |
| Guards and role decorators | Spring Security filter chain, authenticated principal, method/request authorization |
| Custom principal decorators | Typed AuthenticationPrincipal/actor resolver |
| Service/use case | Focused application service/use-case class |
| Prisma service/repository | Repository port + Spring Data JPA/JDBC adapter |
| Exception filter | One RestControllerAdvice with typed error mapping |
| Interceptor response envelope | Response DTO/advice preserving the approved API contract |
| Request ID middleware | OncePerRequestFilter + MDC + response header |
| ConfigModule | Validated ConfigurationProperties and profiles |
| Swagger module | OpenAPI integration approved in LIBRARY.md |
| KafkaJS consumer/producer | Spring for Apache Kafka with validated, idempotent handlers |
| Schedule module | Spring scheduling with safe locking/idempotency where needed |
| Socket.IO gateway | Explicit compatibility decision; never assume STOMP parity |
| Jest/Supertest | JUnit 5, Spring Boot Test, MockMvc, Mockito, and approved integration tooling |

Use constructor injection only. Avoid field injection. Keep framework
annotations out of domain code.

## Target dependency baseline

Use the smallest approved set that covers actual migrated behavior. Prefer
Spring-managed/platform dependencies and document every addition in
LIBRARY.md. Expected categories include:

- Spring Boot Web
- Jakarta Validation
- Spring Security
- Spring Security OAuth2 Resource Server/JOSE for verified JWT processing
- Spring Data JPA and/or focused JDBC where locking or exact SQL is clearer
- PostgreSQL driver
- Flyway for forward-only database migrations
- Spring for Apache Kafka only when Kafka behavior is migrated
- Spring Data Redis only where the source behavior needs it
- Spring Mail only where email behavior is migrated
- Stripe's maintained Java SDK for Stripe integration
- Actuator/Micrometer for safe health and metrics
- OpenAPI tooling approved and recorded in LIBRARY.md
- JUnit 5, Spring Security Test, MockMvc, Mockito, and Testcontainers where
  integration behavior requires real PostgreSQL/Kafka/Redis

Do not add a second ORM, multiple validation systems, hand-written crypto, an
unmaintained JWT library, or a second logging facade. Do not use Hibernate
automatic schema creation in shared or production environments.

## API compatibility

Create `docs/migration/API_PARITY_MATRIX.md`. For every source controller route
and every documented route, record:

`Method | Path | Public/protected | Principal | Permission | Request schema | Success schema | Error codes | Nest test | Spring test | Status`

Requirements:

- Preserve the approved `/v1/api` prefix unless the discrepancy process selects
  a compatibility layer or versioned replacement.
- Preserve HTTP methods, paths, query/path parameters, status codes, headers,
  cookies, serialization, pagination, and error codes required by the frontend
  and approved API contract.
- Keep camelCase JSON, string identifiers, and timezone-bearing ISO-8601
  timestamps where the approved contract requires them.
- Represent money internally with BigDecimal and an explicit currency. Never
  use float or double for authoritative commerce calculations.
- Recalculate price, discount, shipping, tax, totals, stock, order status, and
  payment status on the server.
- Generate an OpenAPI document and compare it with the approved contract.
- Build black-box contract tests that can execute against both NestJS and Spring
  Boot. Normalize only explicitly approved nondeterministic fields such as IDs
  and timestamps.
- Preserve Stripe webhook raw-body signature verification. The webhook handler
  must receive the exact raw bytes and verify the provider signature before
  parsing or mutating state.

Do not implement endpoints that exist only in aspirational documentation as if
they already have production parity. Mark them clearly and migrate them in a
separate approved feature phase.

## Authentication and authorization

Model the authenticated actor explicitly as user, shop, admin, or system.
Never accept actor identity, role, or permissions from request data when it can
be derived from the verified authentication context.

Required behavior:

- Verify JWT signature, subject, expiry, token type, and configured issuer and
  audience.
- Preserve access-token and refresh-token semantics, rotation, revocation,
  device/session tracking, reuse detection, and logout invalidation.
- Determine the exact legacy JWT claims and signing/key lookup behavior from
  source and tests. Add compatibility tests before changing claims.
- A user token cannot access shop-only APIs.
- A shop token cannot access user-private APIs unless the business contract
  explicitly permits it.
- Admin/global access uses explicit protected methods and is audited.
- Shop permissions remain enforced wherever permission data exists.
- Public routes are allowlisted explicitly; everything else is denied by
  default.
- Authenticate first, then check principal type, permission, and resource scope.
- Keep ownership checks in application/use-case code as well as route policy.
- Passwords use an approved adaptive hash. Preserve login compatibility for
  existing hashes and use safe rehash-on-login only with an explicit plan.
- Refresh/reset tokens and other reusable secrets are stored hashed or otherwise
  protected and revocable according to SECURITY.md.
- Never log credentials, JWTs, cookies, authorization headers, password/reset
  tokens, webhook secrets, or full sensitive payloads.

Add allowed and denied integration tests, including cross-user, cross-shop,
wrong-principal, missing-permission, expired-token, revoked-session, repeated
refresh-token, and explicit admin cases.

## Tenant and ownership isolation

Make unsafe access difficult to express:

- Every shop-owned repository method accepts a non-optional shopId or traverses
  an equivalently scoped parent in the same query.
- Every user-private repository method accepts a non-optional userId.
- Never rely only on a route parameter for ownership.
- Global/admin repository methods are separate and explicitly named.
- Background commands carry actor/system scope and a reason.
- Multi-shop orders prevent one shop from viewing or changing another shop's
  order lines.

Use scoped names such as `findByIdForShop(shopId, productId)` and
`findOrderForUser(userId, orderId)`, never a generic unscoped `findById` for
private resources.

## PostgreSQL and migration strategy

Do not recreate or destructively reinterpret the database. First create:

- `docs/migration/DATABASE_PARITY_MATRIX.md`
- a safe schema snapshot from local/test PostgreSQL
- a Prisma-model-to-Java-entity mapping
- a migration history and Flyway baseline plan
- a rollback/restore plan

Requirements:

- Preserve existing table names, column names, IDs, enum values, nullability,
  defaults, indexes, foreign keys, unique constraints, and soft-delete behavior
  during the parity phase.
- Treat existing migration SQL and the verified database schema as evidence;
  do not rely on Prisma declarations alone.
- Never edit an already shared migration. Add forward-only Flyway migrations.
- Configure Hibernate schema management as validation outside isolated tests.
- Use explicit snake_case mappings and do not rely on naming magic for legacy
  columns.
- Map PostgreSQL arrays/JSONB deliberately; do not move stable relational data
  into JSON.
- Preserve data before changing timestamp representation. Convert BigInt epoch
  values only through a tested, reversible, separately approved migration.
- Fix unsafe legacy float money only through a separately reviewed data
  migration with rounding rules, backfill verification, and rollback/export
  plan. Java business logic still uses BigDecimal.
- Add indexes with the same logical migration that introduces a query pattern.
- Test the application against a restored copy of synthetic/local schema data,
  never production customer data.

## Transactions, inventory, checkout, orders, and payment

These are critical sections, not ordinary CRUD.

- Put `@Transactional` boundaries on application use cases, not controllers.
- Load all required state, validate it, and mutate it in one deliberate
  transaction when atomicity is required.
- Reserve stock with an atomic predicate, pessimistic row lock, or justified
  optimistic version check. Never use stale read-modify-write logic.
- Reservation creation checks product/SKU/shop state and available quantity and
  records a clear expiry.
- Reservation release and consumption are idempotent.
- Payment success consumes/finalizes reserved stock exactly once.
- Payment failure, cancellation, expiration, or timeout releases stock exactly
  once.
- Prevent negative inventory, double release, double consume, duplicate order
  finalization, duplicate refund, and duplicate notification.
- Model order, payment, reservation, refund, return, and shipment transitions
  explicitly and reject invalid transitions with stable typed errors.
- Make checkout, payment, refund, webhook, import, and event-consumer commands
  replay-safe with durable idempotency records or equivalent atomic evidence.
- Publish non-critical events only after commit, or use an outbox pattern.
- Do not hold a database transaction open across avoidable network calls.
- Replace the documented checkout N+1 behavior with measured bounded queries,
  without changing the public response.

Required tests include concurrent last-item reservation, insufficient stock,
expired reservation, repeated release, repeated payment success, payment
failure/cancellation, repeated webhook delivery, transaction rollback, invalid
state transition, coupon usage races, and cross-shop order isolation.

## Events, jobs, notifications, and realtime

- Preserve approved domain event names and payload scope.
- Validate every Kafka/event payload before processing.
- Consumers and scheduled jobs are idempotent and safe under retries or
  concurrent instances.
- Do not block checkout/order responses on non-critical notifications.
- Do not put secrets or unnecessary personal data in event payloads.
- Authenticate realtime connections and authorize room/channel membership.
- Realtime messages are not the source of truth for order, payment, or stock.
- For Socket.IO, either preserve the wire protocol with a maintained,
  documented compatible approach or version and migrate the client explicitly.
  Spring WebSocket/STOMP is not a drop-in replacement.

## Errors, logging, configuration, and operations

- Use typed domain/application exceptions and map them once with
  RestControllerAdvice.
- Preserve approved error codes such as VALIDATION_ERROR, UNAUTHENTICATED,
  FORBIDDEN, NOT_FOUND, INSUFFICIENT_STOCK, RESERVATION_EXPIRED,
  INVALID_ORDER_STATE, VERSION_CONFLICT, RATE_LIMIT_EXCEEDED, and
  DOWNSTREAM_UNAVAILABLE.
- Never return a production stack trace or internal exception details.
- Add/generate a request ID, return it in the response header/envelope, and put
  safe correlation fields in MDC.
- Use structured logs with safe actor/scope identifiers and redaction required
  by SECURITY.md.
- Use validated `@ConfigurationProperties`; fail fast for missing production
  configuration. Do not scatter direct environment reads through business code.
- Use profiles such as local, test, and production. Local defaults must be
  obviously non-production and use synthetic data.
- Health endpoints expose no sensitive internals; debug endpoints are disabled
  or protected in production.
- CORS uses an allowlist in non-local environments. Do not preserve wildcard
  credentialed CORS.
- Keep request/body/file limits route-appropriate. Do not carry a global 50 MB
  allowance into every endpoint without a documented requirement.

## Migration execution phases

Use a strangler-style, test-backed migration. Complete and verify one bounded
slice at a time.

Phase 0 - Inventory and baselines
- Read all required sources.
- Create the discrepancy, Markdown, API, database, dependency, and module parity
  matrices.
- Capture current NestJS build/test status without claiming failures are caused
  by the migration.
- Capture route/OpenAPI behavior and representative sanitized fixtures.
- Record target architecture and cutover/rollback ADRs.

Phase 1 - Spring foundation
- Establish Maven build, profiles, validated configuration, PostgreSQL/Flyway,
  request IDs, safe logging, error mapping, validation, OpenAPI, health checks,
  and test infrastructure.
- Add no business endpoint until the security filter chain is deny-by-default.

Phase 2 - Identity and principals
- Migrate auth, refresh/session/key-token behavior, user/shop/admin principals,
  permissions, and negative authorization tests.

Phase 3 - Accounts and catalog
- Migrate user, shop, product, SPU, SKU, category, and brand behavior.
- Prove user/shop isolation and public-safe projections.

Phase 4 - Cart, discounts, and inventory
- Migrate cart ownership, authoritative pricing inputs, discounts, stock,
  reservations, and concurrency tests.

Phase 5 - Checkout, orders, and payments
- Migrate transactional checkout/order creation and Stripe/COD flows.
- Prove raw webhook verification, idempotency, reservation finalization/release,
  and failure compensation.

Phase 6 - Comments, notifications, Kafka, realtime, and schedulers
- Migrate remaining modules with scope validation, moderation/participant rules,
  idempotent consumers, safe scheduling, and explicit realtime compatibility.

Phase 7 - Parity, performance, and cutover
- Run both backends against isolated equivalent test data.
- Run contract, security, concurrency, integration, E2E, and relevant frontend
  tests.
- Compare query counts and latency for critical workflows without making
  unsupported production-performance claims.
- Rehearse database backup/restore, traffic switch, rollback, and session/token
  compatibility.
- Remove or archive NestJS only after the project owner approves evidence-based
  cutover.

At the end of every phase, update the parity matrices and documentation. Do not
mark a row complete unless an automated test or explicit inspection evidence is
linked.

## Required deliverables

1. Working Spring Boot source and Maven Wrapper build.
2. Updated AGENTS.md, SECURITY.md, LIBRARY.md, CODING_STANDARDS.md, README.md,
   QUICK_START.md, HELP.md, BACKEND_DOCUMENTATION.md, API_REFERENCE.md, and
   ISSUES_AND_FIXES.md with preserved intent.
3. `docs/migration/DISCREPANCY_REGISTER.md`.
4. `docs/migration/MARKDOWN_PARITY_MATRIX.md`.
5. `docs/migration/MODULE_PARITY_MATRIX.md`.
6. `docs/migration/API_PARITY_MATRIX.md`.
7. `docs/migration/DATABASE_PARITY_MATRIX.md`.
8. Architecture decisions for target layout, auth/token compatibility,
   persistence/Flyway adoption, realtime protocol, event publication, and
   cutover/rollback.
9. Flyway baseline and forward migrations with no destructive surprise.
10. Automated unit, integration, contract, security, concurrency, and E2E tests
    proportional to each migrated risk.
11. Sanitized local/test fixtures only.
12. A final migration report listing completed parity, intentional differences,
    unresolved risks, verification commands/results, and rollback readiness.

## Verification gates

Run the checks that exist in each project and report exact commands and results.
At minimum, aim for:

- `./mvnw verify` or `mvnw.cmd verify` on Windows
- Spring unit and integration tests
- PostgreSQL Testcontainers tests for repositories and transactions
- auth allow/deny and cross-tenant security tests
- inventory/discount concurrency tests
- payment webhook signature and replay tests
- black-box API contract comparison against NestJS
- generated OpenAPI comparison
- frontend typecheck/build and relevant API/E2E tests
- migration validation on a disposable restored local/test database
- secret/dependency scans where configured
- `graphify update .` after code changes when graphify is present

Never say a test passed if it was not run. Distinguish pre-existing source
failures from migration regressions.

## Working behavior

- Make the smallest complete change in the current phase.
- Preserve unrelated user changes and a dirty worktree.
- Do not add dependencies without updating LIBRARY.md.
- Do not mix unrelated cleanup into migration slices.
- Do not delete the NestJS implementation, old migrations, or legacy docs
  during parity work.
- Do not expose secrets in output.
- Proceed autonomously on routine, reversible implementation details.
- Stop and ask for a project-owner decision when a choice changes an external
  API, JWT/session compatibility, database data, payment behavior, inventory
  semantics, tenant isolation, or cutover strategy.

For each work session, lead with the current migration outcome, then summarize:

- files changed;
- parity rows completed;
- security/data-integrity decisions;
- commands run and results;
- discrepancies or risks still open;
- the next smallest safe migration slice.

The migration is complete only when the Spring Boot service satisfies the
approved API and data contracts, all required security and ecommerce integrity
rules still hold, the Markdown parity matrix is complete, critical tests pass,
and cutover plus rollback have been rehearsed. Compiling is not parity.
```

