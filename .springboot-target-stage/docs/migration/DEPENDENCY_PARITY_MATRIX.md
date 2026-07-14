# Dependency Parity Matrix

No dependency is approved merely by appearing here. `LIBRARY.md` records each
addition before it enters the Maven build.

| Source responsibility | Source dependency | Spring target | Phase | Decision |
| --- | --- | --- | --- | --- |
| HTTP API | NestJS + Express | `spring-boot-starter-web` | 1 | Required |
| Validation | class-validator/class-transformer | `spring-boot-starter-validation` | 1 | Required |
| Authentication/authorization | Passport, Nest JWT, jsonwebtoken | `spring-boot-starter-security`, `spring-boot-starter-oauth2-resource-server` | 1/2 | Required; JOSE only, no extra JWT library |
| ORM/querying | Prisma + pg adapter | `spring-boot-starter-data-jpa` and Spring JDBC for exact locking SQL | 1+ | One Hibernate/JPA ORM; JDBC is a focused query adapter, not a second ORM |
| Database | `pg` | PostgreSQL JDBC driver | 1 | Runtime only |
| Schema migration | Prisma migrations | Flyway PostgreSQL | 1 | Baseline existing schema; forward-only migrations |
| OpenAPI | Nest Swagger | `springdoc-openapi-starter-webmvc-ui` 2.8.x | 1 | Spring Boot 3.5.x compatibility documented by springdoc |
| Health/metrics | none consistently | `spring-boot-starter-actuator` | 1 | Health details restricted |
| Testing | Jest/Supertest | Spring Boot Test, Spring Security Test, Testcontainers PostgreSQL/JUnit | 1+ | Required by risk gates |
| Password hashing | Node built-in Argon2 | Bouncy Castle `bcprov-jdk18on` 1.84 low-level Argon2id API | 2 | Approved after exact synthetic Node 25 vector capture; no parameter/format change |
| OAuth login | passport-google-oauth20 | Spring Security OAuth2 Client | 3 | Added for Google authorization-code/OIDC login; temporary handshake session is isolated from stateless bearer APIs |
| Stripe | Stripe Node SDK | Stripe Java SDK 33.1.0 | 5 | Added; exact raw-body signature test, deterministic provider idempotency, durable local event/command replay, no raw card handling |
| Kafka | KafkaJS | Spring for Apache Kafka 3.3.10 (Boot-managed) | 6 | Added with migrated product/discount events, DLT retries, transactional outbox, and durable notification receipts; disabled by default |
| Email | Nest mailer | Spring Boot Mail/JavaMailSender | 2/6 | Added for Phase 2 reset delivery; notification mail remains Phase 6 |
| Redis | Documented, no live source use | Spring Data Redis | future | Not added until a concrete behavior requires it |
| Socket.IO | package present, no gateway | None | 6 | STOMP is not a compatibility substitute |
| Discord | discord.js | None | 1 | Unsafe global request forwarding is not migrated |
| Excel | exceljs types only | None | future | No live import/export flow to migrate |

## Version baseline

- Spring Boot: 3.5.7 (owner-specified; unchanged).
- Java: 25 (owner-specified; local toolchain verified).
- Maven wrapper: generated and pinned to Maven 3.9.11 in Phase 1.
- springdoc: 2.8.x, whose official compatibility matrix maps to Spring Boot
  3.5.x. Version 2.8.17 is recorded in `LIBRARY.md` and the POM.

Dependency verification: `mvnw.cmd verify` completed successfully on
2026-07-04. Phase 2 added Bouncy Castle 1.84 for exact legacy Argon2id
compatibility and Spring Boot Mail for the migrated password-reset notifier;
Phase 3 added Spring Security OAuth2 Client for the Google authorization-code
flow. All are recorded in `LIBRARY.md`.
Phase 5 added Stripe Java SDK 33.1.0, the latest stable release inspected on
2026-07-02; provider API calls remain disabled unless explicitly configured.
Phase 6 added Boot-managed Spring for Apache Kafka 3.3.10. Kafka remains
disabled by default; database outbox and consumer replay behavior are verified,
while a real-broker E2E run remains a Phase 7 gate.
