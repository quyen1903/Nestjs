# Markdown Parity Matrix

The untouched source copies are retained under
`docs/legacy/nestjs/source-docs/`. Target documents are adapted incrementally;
`Phase 0 inventory` does not mean Spring behavior is implemented.

| Source file | Target file | Sections retained | Spring adaptations | Intentional corrections | Evidence |
| --- | --- | --- | --- | --- | --- |
| `AGENTS.md` | `AGENTS.md` | Mission, read order, security and ecommerce gates, graphify rules | Java/Spring module, Flyway, verification, and source-retention guidance added | None | Phase 1 inspection |
| `SECURITY.md` | `SECURITY.md` | All security, tenant, payment, inventory, logging, privacy, dependency, and incident controls | Spring Security, principal, configuration, Flyway, error, logging, Actuator, lockout, compatibility-token, cart, discount, inventory, reservation, checkout, order, webhook, refund, event, comment, and scheduler controls added | Insecure live behaviors are explicit breaks | Phase 1-6 security/PostgreSQL tests; D-004 through D-008, D-014/D-015, D-017/D-018, D-020/D-021, D-026 through D-032 |
| `LIBRARY.md` | `LIBRARY.md` | Dependency philosophy, frontend, PostgreSQL, Redis, Kafka, Stripe, storage, observability, and infrastructure rules | Authoritative Spring Boot 3.5.7/Java 25 dependency baseline and deferred additions | Stale backend stack archived | `pom.xml`; dependency matrix |
| `CODING_STANDARDS.md` | `CODING_STANDARDS.md` | Source-of-truth order, ecommerce, frontend, API, event, testing, and observability standards | Package-by-feature Java layers, records, validation, transactions, security, repositories, and tests added | None | ADR-0001; Phase 1 source inspection |
| `README.md` | `README.md` | Product and frontend relationship | Maven, profiles, dual-run ports, Phase 2-6 status, evidence links | Nest-only description archived | Phase 1-6 reports; ADR-0002/0006 |
| `QUICK_START.md` | `QUICK_START.md` | Local-only secrets and service prerequisites | Maven wrapper, profiles, parallel ports, safe empty-database setup | Destructive database reset guidance removed | Flyway runbook; D-012 |
| `BACKEND_DOCUMENTATION.md` | `BACKEND_DOCUMENTATION.md` | Domain/module intent | Spring architecture and honest phase status | Unsupported performance/realtime/readiness claims removed or qualified | Module matrix; Phase 1 report |
| `API_REFERENCE.md` | `API_REFERENCE.md` | External contract candidates and examples | `/v1/api`, live envelope, actual Phase 1-6 routes, OpenAPI links | `/api`, persistence leakage, public draft exposure, client-priced commerce inputs, unsafe comment/checkout/refund replay, category stubs, stale envelopes, and unimplemented COD/history routes marked historical | API parity matrix; auth/catalog/commerce/payment/comment/foundation tests |
| `ISSUES_AND_FIXES.md` | `ISSUES_AND_FIXES.md` | Six legacy issue intents plus discovered migration risks | Converted to acceptance-evidence register R-001 through R-026 | No issue marked fixed without evidence | Phase 1-6 tests; module matrix |
| `HELP.md` | `HELP.md` | Official references | Project-specific build, database, security, source-runtime, and rollback diagnostics | Generic generated scaffold text replaced | Phase 1 report; baseline verification |
| `apps/api/src/API_REFERENCE.md` | `docs/legacy/nestjs/source-docs/apps-api-API_REFERENCE.md` | Complete byte-identical legacy copy | Root `API_REFERENCE.md` is canonical | Duplicate path archived with forwarding note in Phase 1 | SHA-256 equality verified in Phase 0 |
| `apps/web/README.md` | `docs/legacy/frontend/README.md` | Entire frontend convention | None; frontend remains in the source monorepo | None | Source copy; frontend client inspection |
| `SPRING_BOOT_MIGRATION_PROMPT.md` | `SPRING_BOOT_MIGRATION_PROMPT.md` | Entire migration control document | Target path is recorded in migration reports rather than rewriting the source prompt | None | Source copy |

## Classification summary

- Durable product/security/domain sections: retained.
- Java/Spring translations: scheduled for Phase 1 and refined with each slice.
- Frontend conventions: retained unchanged.
- NestJS operational details: archived under `docs/legacy/nestjs`.
- Stale statements: corrected only with discrepancy and source evidence.
- Aspirational features: retained as planned, never represented as parity.
