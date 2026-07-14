# Ecommerce Library Standards

> Entry: `AGENTS.md` -> `SECURITY.md` -> this file ->
> `CODING_STANDARDS.md`.
>
> The unchanged NestJS-era document is archived at
> `docs/legacy/nestjs/source-docs/LIBRARY.md`.

## 1. Dependency policy

Use a dependency only when it is maintained, secure, license-compatible, and
materially reduces risk or complexity. Prefer Spring Boot dependency management
and one library per responsibility. Lock changes belong with code and tests.

For every addition record: purpose, owner/capability, maintenance/security
posture, runtime impact, alternatives, and removal path. Do not add a second
ORM, validation system, JWT stack, logging facade, or hand-written crypto.

## 2. Approved implementation stack

| Area | Approved | Rationale/constraint |
| --- | --- | --- |
| Backend runtime | Java 25 | Owner-specified target; verified locally. Do not change silently. |
| Backend framework | Spring Boot 3.5.7 | Owner-specified target; modular monolith only. |
| Build | Maven Wrapper | CI and local builds use `mvnw`/`mvnw.cmd`. |
| HTTP | Spring MVC (`spring-boot-starter-web`) | Servlet stack matching current request/response API. |
| Validation | Jakarta Bean Validation (`spring-boot-starter-validation`) | Validate records at API boundaries. |
| Security | Spring Security + OAuth2 Resource Server/JOSE | Verified JWT processing and deny-by-default routes; no extra JWT library. |
| Google OAuth login | Spring Security OAuth2 Client/OIDC | Phase 3 authorization-code flow; temporary handshake session is isolated, verified email is required, and provider tokens are not persisted. |
| Legacy password verification | Bouncy Castle provider 1.84 low-level Argon2 API | Required to reproduce the Node 25 Argon2id format exactly; fixed source-generated vector required. Do not install it as a global JCA provider. |
| Persistence | Spring Data JPA/Hibernate | Single ORM; entities remain infrastructure-only. |
| Exact SQL/locking | Spring JDBC supplied by the data stack | Focused adapters for `FOR UPDATE`, atomic predicates, and legacy identifiers; not a second ORM. |
| Database | PostgreSQL 16 driver | Preserve the verified legacy schema. |
| Migrations | Flyway Core + Flyway PostgreSQL | Explicit existing-schema baseline and forward-only changes. |
| OpenAPI | springdoc-openapi 2.8.17 | Official compatibility matrix maps 2.8.x to Spring Boot 3.5.x. |
| Health/metrics | Spring Boot Actuator/Micrometer | Expose health only by default and never sensitive details. |
| Password-reset delivery | Spring Boot Mail/JavaMailSender | Phase 2 reset delivery only; SMTP secrets stay external and reset tokens are never logged. |
| Stripe payments | Stripe Java SDK 33.1.0 | Maintained provider SDK for typed intent/refund/customer calls and webhook signature verification. Requests use per-call credentials and deterministic provider idempotency keys; raw card data is never handled. |
| Test | Spring Boot Test, JUnit 5, Mockito, AssertJ, MockMvc | Managed by the Spring Boot test starter. |
| Security test | Spring Security Test | Required for allow/deny and actor tests. |
| Integration test | Spring Boot Testcontainers + PostgreSQL Testcontainers | Real transaction/locking/schema behavior; synthetic data only. |

Primary references:

- Spring Boot 3.5 reference: <https://docs.spring.io/spring-boot/3.5/>
- Spring Security resource server: <https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/>
- Spring Security OAuth2 login: <https://docs.spring.io/spring-security/reference/servlet/oauth2/login/advanced.html>
- springdoc compatibility: <https://springdoc.org/faq.html>
- Bouncy Castle 1.84 artifact metadata:
  <https://central.sonatype.com/artifact/org.bouncycastle/bcprov-jdk18on/1.84>
- Stripe Java SDK releases: <https://github.com/stripe/stripe-java/releases>
- Stripe webhook signature requirements: <https://docs.stripe.com/webhooks/signature>
- Stripe idempotent request contract: <https://docs.stripe.com/api/idempotent_requests?lang=java>

The legacy NestJS service stores PKCS#1 RSA public keys. Phase 2 wraps the
bounded public DER value into the JDK-supported X.509 public-key structure and
uses the managed Nimbus verifier already supplied by Spring Security. No extra
PEM, JWT, or cryptography dependency is approved for this behavior.

## 3. Deferred backend dependencies

Add these only in the phase that implements and tests the behavior:

| Dependency category | Earliest phase | Gate |
| --- | --- | --- |
| Password encoding replacement | 2/future | Legacy Argon2 verifier is approved; any new encoding or parameter change requires versioned hashes and upgrade-on-login tests |
| Spring for Apache Kafka 3.3.10 (Boot-managed) | 6 | Implemented for typed product/discount events, DLT retry policy, outbox publication, and durable consumer idempotency |
| Spring Data Redis | future | Concrete cache/lock/rate-limit/session behavior and failure model |
| Realtime library | 6/future | Explicit Socket.IO compatibility or versioned client migration decision |

## 4. Frontend and workspace standards retained

The frontend remains Next.js App Router + React with shadcn/ui, Tailwind,
TanStack Query/Table, React Hook Form, Zod, and Playwright where already used.
Do not introduce a parallel UI, server-state, form, validation, or package
manager stack. pnpm remains the source monorepo package manager.

## 5. Data, messaging, and integrations retained

- PostgreSQL is the system of record; Redis is never authoritative for orders,
  inventory, payment, tenant, or discount state.
- Kafka is optional and disabled by default. Phase 6 consumers validate target
  scope, accept the bounded legacy product-event shape during dual-run, and
  deduplicate through PostgreSQL receipts. Business writes use an outbox.
- Stripe is the payment provider; raw card data is never stored.
- S3/MinIO-compatible object storage remains private by default when introduced.
- Email, Discord, SMS, and other providers must document data flow, retry,
  telemetry, failure, and removal behavior. The unsafe global Discord request
  forwarding middleware is not approved in Spring.
- Prometheus/Grafana, Datadog/CloudWatch, Sentry, and incident routing remain
  deployment decisions; no telemetry may export confidential data by default.

## 6. Supply-chain rules

- Dependencies come from approved Maven repositories and Spring-managed
  versions where available.
- CI uses the Maven Wrapper and reproducible dependency resolution.
- Review licenses, vulnerabilities, transitive dependencies, network behavior,
  and install/build plugins.
- Do not execute unreviewed download scripts or add dependencies for small JDK
  capabilities.
- Security fixes are prioritized; unrelated major upgrades are separate work.

## 7. Addition checklist

- [ ] The dependency solves a current phase requirement.
- [ ] The JDK or approved stack cannot solve it cleanly.
- [ ] Maintenance, license, and security posture are reviewed.
- [ ] Runtime/network/data-flow impact is understood.
- [ ] Integration and failure behavior have tests.
- [ ] This file and the dependency parity matrix are updated.
- [ ] No duplicate framework responsibility is introduced.

## Related

- `AGENTS.md`
- `SECURITY.md`
- `CODING_STANDARDS.md`
- `docs/migration/DEPENDENCY_PARITY_MATRIX.md`
