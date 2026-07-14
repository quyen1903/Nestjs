# PULSE Library Standards

> Entry: `CLAUDE.md` or `AGENTS.md` -> `SECURITY.md` -> this file -> `CODING_STANDARDS.md`.
> Purpose: keep the implementation stack boring, auditable, and consistent.

---

## 1. Dependency Philosophy

Use a dependency when it is proven, maintained, secure, and materially reduces complexity. Do not use dependencies to avoid understanding the domain.

### Rules

- Prefer the libraries already named in the technical stack.
- Prefer workspace packages for shared PULSE logic.
- Prefer small focused packages over broad frameworks when the stack already has a framework.
- Prefer typed APIs and generated clients over stringly typed integrations.
- Pin through lockfiles and frozen CI installs.
- Document every major new dependency in this file.
- Remove libraries that are unused, unmaintained, duplicated, or security-liability.

### Decision tree

```text
Need a library?
  |
  +-- Is it already in the approved stack?
  |     -> use it
  |
  +-- Can an existing workspace package solve this?
  |     -> extend the package if ownership is clear
  |
  +-- Is the problem security/crypto/auth/parsing/payments?
  |     -> use a proven library, do not hand-roll
  |
  +-- Is the problem small and stable?
  |     -> write the code locally
  |
  +-- Is the dependency maintained, typed, audited, and license-compatible?
        -> document and add
```

---

## 2. Approved Stack Summary

| Area | Approved | Notes |
| --- | --- | --- |
| Monorepo | Turborepo | Use filters for services/packages |
| Package manager | pnpm or Bun, finalized by implementation repo | Do not mix lockfile strategies casually |
| Backend API | NestJS + Fastify | Management-plane services |
| Gateway | NestJS + Fastify + low-overhead proxy | Single external API entry |
| Frontend | Next.js App Router + React | Admin and tenant portals |
| UI | shadcn/ui + Tailwind | No unrelated custom design-token system |
| Server state | TanStack Query | Frontend API state |
| Data grids | TanStack Table | Admin/tenant tables |
| Validation | Zod | Shared API/frontend/SDK schemas |
| Database | PostgreSQL + Drizzle | System of record |
| Vector | pgvector | Entity embeddings/search |
| Cache/queue | Redis + BullMQ | Hot state and async jobs |
| Inference | Rust | Real-time low-latency engine |
| Offline ML | Python + PyTorch/Hugging Face | Tagging/training/export |
| Object storage | S3/MinIO | Private by default |
| Observability | Prometheus/Grafana/Datadog/CloudWatch/Sentry | Use as deployment finalizes |

---

## 3. Package Manager Standards

| Must | Must not |
| --- | --- |
| Use one lockfile strategy per implementation repo | Keep `pnpm-lock.yaml`, `bun.lockb`, and `package-lock.json` fighting |
| Use frozen installs in CI | Let CI update dependency versions |
| Use workspace protocol for internal packages | Publish internal packages accidentally |
| Commit lockfile changes with dependency changes | Hide dependency drift |

Root scripts should support:

```json
{
  "dev": "turbo run dev",
  "build": "turbo run build",
  "test": "turbo run test",
  "lint": "turbo run lint",
  "typecheck": "turbo run typecheck"
}
```

---

## 4. Frontend Libraries

| Need | Use | Do not use |
| --- | --- | --- |
| Framework | Next.js App Router | Custom router |
| UI components | shadcn/ui | Random component kits without review |
| Styling | Tailwind + CSS variables | Inline style sprawl |
| Icons | lucide-react | Custom SVGs for common icons |
| Forms | React Hook Form + Zod | Manual form state for complex forms |
| Server state | TanStack Query | `useEffect` fetch loops |
| Tables | TanStack Table | Hand-rolled sortable/paginated grids |
| Charts | Recharts or approved alternative | Heavy chart suites without need |
| Dates | date-fns or approved alternative | Moment.js |
| E2E | Playwright | Selenium unless required |

### shadcn/ui rules

- Use primitives and variants from shadcn/ui.
- Extend components in `packages/ui` only when repeated and justified.
- Do not create one-off `AppButton`, `AppCard`, or `AppInput` wrappers just to rename existing components.
- Keep accessibility behavior from the primitives.
- Use lucide-react icons for standard actions.

### TanStack Query rules

- Queries live close to the feature but use typed API clients.
- Mutations invalidate or update relevant queries deliberately.
- Error handling maps API error codes to UI messages.
- Do not use TanStack Query for purely local UI state.

---

## 5. Backend TypeScript Libraries

| Need | Use | Notes |
| --- | --- | --- |
| Framework | NestJS | Modules by capability |
| HTTP adapter | Fastify | Default server runtime |
| Config | `@nestjs/config` + schema validation | Fail fast |
| Validation | Zod | Shared schemas |
| AuthZ | CASL | Ability-based authorization |
| Database | Drizzle | Schema/migration owner in `packages/db` |
| Redis | ioredis or approved Redis client | Keep client lifecycle managed |
| Queues | BullMQ | Imports, webhooks, async work |
| Proxy | undici / approved Fastify proxy | Low overhead, streaming |
| Circuit breaker | opossum | Gateway downstream resilience |
| Metrics | prom-client | Prometheus format |
| API docs | Swagger/OpenAPI | Keep schemas accurate |
| Testing | Jest or Vitest | Match repo standard |

### Backend library constraints

- Do not add a second ORM.
- Do not add a second validation system for API contracts.
- Do not add a global state library to backend services.
- Do not hand-roll cryptography.
- Do not parse CSV/Excel with ad hoc string splitting when robust libraries exist.
- The legacy NestJS API lists `@prisma/client-runtime-utils` directly at the
  exact installed Prisma Client version because its custom generated-client
  output imports that package from the API package boundary. Keep these
  versions aligned; this is a pnpm runtime-resolution requirement, not a second
  ORM.

---

## 6. Database And Storage Libraries

| Need | Use | Notes |
| --- | --- | --- |
| Primary DB | PostgreSQL 16 | RDS in production |
| ORM/migrations | Drizzle | Type-safe schema |
| Vector search | pgvector | HNSW when scale requires |
| Cache | Redis 7 | Rate limits, cache, counters |
| Queue backing | Redis + BullMQ | Keep queue keys namespaced |
| Object storage | S3 SDK / MinIO compatible SDK | Private default |
| File parsing | Maintained CSV/XLSX libs | Validate and stream for large files |

Rules:

- Do not use Redis as the source of truth for billing or tenant state.
- Do not use object storage paths as authorization proof.
- Do not bypass Drizzle migrations for schema changes unless an emergency runbook says so.

---

## 7. Rust Inference Libraries

| Need | Preferred | Notes |
| --- | --- | --- |
| Async runtime | Tokio | Standard async runtime |
| HTTP | Axum or approved framework | Keep routing thin |
| Serialization | serde | Explicit contracts |
| Redis | Async Redis client | Bounded timeouts |
| Vector/model runtime | ONNX Runtime bindings | Match offline export |
| Errors | thiserror/anyhow split | thiserror for typed app errors, anyhow for binaries/tools |
| Tracing | tracing | Request-scoped logs |
| Benchmarking | criterion | Ranking/cache-sensitive code |

Rules:

- Do not add runtime-heavy frameworks that threaten p95 latency without benchmarks.
- Do not use random tie-breakers in ranking without deterministic seed/context.
- Do not make blocking network calls on async runtime threads.

---

## 8. Python Offline Brain Libraries

| Need | Preferred | Notes |
| --- | --- | --- |
| ML | PyTorch | Training and evaluation |
| Models/tokenizers | Hugging Face Transformers | Version model/config |
| Efficient tuning | PEFT | When appropriate |
| Batch serving experiments | vLLM | Offline/batch workflows |
| Data contracts | Pydantic | Config and artifact manifests |
| Dataframes | pandas/polars | Choose based on scale |
| Experiment tracking | Approved tracker | Must capture metrics/artifacts |
| Testing | pytest | Unit/integration |

Rules:

- Do not promote artifacts without metrics.
- Do not send tenant secrets or sensitive personal data to external model providers.
- Do not write scripts that mutate production state without explicit environment checks.

---

## 9. Infrastructure Libraries And Tools

| Need | Use | Notes |
| --- | --- | --- |
| Containers | Docker | Minimal images |
| Cloud | AWS | ECS, RDS, ElastiCache, S3, CloudFront, WAF |
| IaC | Terraform | Reviewed like code |
| CI/CD | GitHub Actions | Lint, test, audit, build, deploy |
| Secrets | AWS Secrets Manager | No source secrets |
| Monitoring | Prometheus/Grafana + Datadog/CloudWatch | Deployment-dependent |
| Error tracking | Sentry | Frontend/backend as needed |
| Incident routing | PagerDuty | Production alerts |

---

## 10. Communications And Integrations

| Need | Use | Notes |
| --- | --- | --- |
| Email | AWS SES primary, SendGrid fallback | SPF/DKIM/DMARC and warm-up |
| SMS | Twilio | OTP and critical billing alerts only |
| Payments | Stripe | Webhook signature verification |
| WebSockets | `@fastify/websocket` | Redis Pub/Sub for multi-instance |
| Webhooks | Custom BullMQ worker | HMAC, SSRF protections, retries |

Rules:

- Do not send marketing SMS by default.
- Do not process payment webhooks without signature verification.
- Do not deliver webhooks to internal/private networks.

---

## 11. Testing Libraries

| Need | Use |
| --- | --- |
| TypeScript unit/integration | Jest or Vitest |
| API integration | Supertest, Fastify inject, or approved equivalent |
| Frontend component | Testing Library |
| Frontend e2e | Playwright |
| Load | k6 or autocannon |
| Rust tests | cargo test |
| Rust benchmarks | criterion |
| Python tests | pytest |
| Dependency audit | pnpm audit, cargo audit, pip-audit, Snyk |

Testing library rule: choose one standard per language/app and use it consistently.

---

## 12. Adding A New Dependency

Add a note to the relevant section with:

```text
Name:
Purpose:
Used by:
Why existing stack is insufficient:
Security posture:
Maintenance status:
License:
Runtime/bundle impact:
Alternatives considered:
Removal/migration path:
```

Minimum acceptance:

- Maintained.
- License-compatible.
- No known unresolved critical vulnerabilities.
- Typed or type definitions available for TypeScript.
- Does not require unnecessary privileges.
- Does not conflict with existing approved stack.

---

## 13. Disallowed By Default

- Hand-rolled cryptography.
- Unmaintained auth libraries.
- Multiple ORMs.
- Multiple API validation systems.
- Browser packages that require secret keys.
- Telemetry SDKs that export user data without review.
- Heavy chart/UI/form packages when approved libraries already cover the need.
- Packages with install scripts that perform opaque network actions.
- Libraries that bypass gateway, auth, tenant scoping, audit, or validation.

---

## 14. Upgrade Policy

| Upgrade type | Standard |
| --- | --- |
| Patch | Usually safe, still run tests |
| Minor | Read changelog, run tests, watch behavior changes |
| Major | Plan migration, update docs, run broad regression tests |
| Security fix | Prioritize, patch quickly, document risk if blocked |

Do not batch unrelated major upgrades with feature work.

---

## 15. Dependency Review Checklist

- [ ] Solves a real problem.
- [ ] Approved stack cannot already solve it cleanly.
- [ ] Maintained and license-compatible.
- [ ] Security reviewed.
- [ ] Runtime impact understood.
- [ ] Tests cover integration.
- [ ] Documented in this file.
- [ ] Lockfile updated intentionally.

---

## Related

`CLAUDE.md` - `AGENTS.md` - `SECURITY.md` - `CODING_STANDARDS.md`
