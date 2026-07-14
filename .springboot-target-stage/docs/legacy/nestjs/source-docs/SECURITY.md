# Ecommerce Security Standard

> Entry order: `AGENTS.md` -> this file -> `LIBRARY.md` ->
> `CODING_STANDARDS.md` -> relevant requirements and source code.
> This file overrides ordinary coding preference whenever security, payment,
> inventory consistency, tenant isolation, or customer data protection is
> involved.

---

## 1. Purpose And Security Model

This project is an ecommerce platform with buyer-facing flows, seller/shop
management, product catalog, cart, checkout, order processing, inventory
reservation, discounts, notifications, comments/reviews, authentication, and
authorization.

Security is part of feature design, domain modeling, implementation, testing,
deployment, monitoring, and incident response. This document does not claim
legal, regulatory, PCI, or privacy-law compliance. It defines engineering
controls that support a secure ecommerce implementation.

Primary actors:

| Actor | Meaning | Main Scope |
| --- | --- | --- |
| `user` | Buyer/customer account | `userId` |
| `shop` | Seller/business account | `shopId` |
| `admin` | Platform operator | Explicit admin permissions |
| `system` | Internal job, event consumer, scheduler, or integration | Explicit system scope and reason |

JWT payloads may represent different principals:

```ts
type JwtUser = {
  sub: string; // userId
  role: 'user';
  email: string;
  iat: number;
  exp: number;
};

type JwtShop = {
  sub: string; // shopId
  role: 'shop';
  permissions: string[];
  iat: number;
  exp: number;
};
```

Rules:

- Shop-owned data must be isolated by `shopId`.
- User-private data must be isolated by `userId`.
- Admin access must be explicit, authenticated, authorized, and audited.
- Client-supplied identity, role, permission, price, stock, discount, shipping,
  tax, total, order status, or payment status is untrusted.

---

## 2. Control Baseline

The security program SHOULD align to:

- OWASP ASVS for application security verification.
- OWASP API Security Top 10 for API-specific risk.
- OWASP Top 10 for general web application risk.
- OWASP Cheat Sheet Series for implementation guidance.
- PCI DSS when cardholder data is stored, processed, or transmitted.
- NIST Cybersecurity Framework for security governance outcomes.
- NIST SP 800-63 guidance for digital identity where applicable.
- NIST SSDF for secure software development practices.

Internal product requirements, applicable law, contractual requirements, and
security review decisions take precedence when stricter.

---

## 3. Highest-Risk Areas

Treat the following areas as high risk by default:

- Authentication, registration, login, refresh tokens, password reset, OAuth,
  MFA, sessions, API keys, and service identities.
- Authorization across user, shop, admin, system, role, permission, ownership,
  and tenant boundaries.
- Cart, checkout, order creation, payment creation, payment webhook handling,
  refund, cancellation, and return workflows.
- Product, SKU, inventory, inventory reservation, stock movement, and expired
  reservation release.
- Discounts, coupons, usage counters, per-user limits, shop/product/category
  eligibility, and money calculations.
- Admin actions over users, shops, products, orders, payments, discounts,
  inventory, reviews, messages, exports, or security settings.
- Webhooks, event consumers, scheduled jobs, imports, exports, file uploads,
  notifications, and realtime subscriptions.
- Secrets, signing keys, provider credentials, webhook secrets, payment keys,
  email/SMS credentials, and production configuration.
- Audit logs, security logs, abuse controls, and incident evidence.

Any change in these areas requires careful design, negative tests, and explicit
review of failure paths.

---

## 4. Data Classification

Default assumption: data is confidential unless requirements classify it as
public.

| Class | Examples | Handling |
| --- | --- | --- |
| Public | Published product name, public product description, public product images, public category pages | Expose intentionally and minimally |
| Internal | Runbooks, synthetic fixtures, architecture notes, non-sensitive metrics | Access limited to the team and approved tooling |
| Customer confidential | User email, phone, address, profile, order history, cart, wishlist, device data, IP address | User/admin scoped; redact in logs |
| Shop confidential | Shop profile drafts, private shop settings, seller email, payout metadata, unpublished products, internal notes | Shop/admin scoped; redact sensitive fields |
| Commerce confidential | Orders, order items, shipment data, invoices, returns, refunds, discount usage, inventory movement | Scope strictly; audit privileged access |
| Payment sensitive | Payment intent ids, provider customer ids, webhook event ids, refund ids, partial card metadata | Minimize, never log secrets, verify provider source |
| Cardholder data | PAN, CVV, track data, PIN, card expiry where applicable | Avoid storing; PCI scope applies if processed |
| Authentication secret | Password hashes, refresh tokens, reset tokens, OTP/MFA secrets, session ids, signing keys | Never log; hash/encrypt/store revocably |
| Integration secret | API keys, OAuth tokens, webhook secrets, SMTP credentials, Stripe keys, mTLS keys | Secret manager only; rotate and audit |
| User-generated content | Reviews, comments, messages, shop replies, uploaded images | Validate, moderate where needed, sanitize for display |
| Audit/security evidence | Login events, permission denials, admin actions, webhook decisions, payment/order state transitions | Protected from unauthorized modification and deletion |

Production customer, shop, payment, or order data MUST NOT be copied into local
development or examples unless synthetic or formally de-identified.

---

## 5. Trust Boundaries

```text
Browser / mobile / partner / webhook provider
  -> CDN, WAF, reverse proxy, API gateway
  -> Ecommerce API modules
  -> PostgreSQL, Redis, Kafka/queue, object storage, audit store
  -> Secret manager / KMS
  -> External providers: payment, email, SMS, shipping, analytics, search
  -> Operators and admin tools
```

Rules:

- Browser, mobile, and partner clients are untrusted.
- Queue messages are untrusted until schema, source, scope, and idempotency are
  verified.
- Webhooks are untrusted until provider signatures and replay protections pass.
- File uploads and imports are untrusted even from authenticated accounts.
- Admin tools are high-risk entry points, not trusted backdoors.
- Internal network location does not replace authentication or authorization.
- Client-supplied identity headers must be ignored unless produced by a trusted
  authenticated gateway under a documented contract.

---

## 6. Authentication

All non-public endpoints MUST require authentication.

Requirements:

- Principal type must be explicit: `user`, `shop`, `admin`, or `system`.
- Token validation MUST check signature, subject, expiration, token type, and
  configured issuer/audience when present.
- Refresh tokens MUST be revocable and stored server-side or tracked by secure
  token records.
- Passwords MUST be hashed with an approved adaptive password hashing algorithm
  and unique salts.
- Password reset tokens MUST be random, single-use, expiring, and stored hashed
  or otherwise protected.
- OAuth/provider tokens MUST be minimized and encrypted if storage is required.
- Authentication failures MUST be rate-limited and monitored.
- MFA SHOULD be required for admin access, high-risk shop actions, payout or
  payment settings, and unusual risk signals.
- Service-to-service authentication MUST use a documented service identity such
  as signed token, mTLS, workload identity, or equivalent approved control.

Never infer admin status from email address, route path, environment, local
development convenience, or frontend UI state.

---

## 7. Authorization And Resource Isolation

Authorization must answer:

1. Who is the actor?
2. What action is requested?
3. Which resource is targeted?
4. Is the resource inside the actor's allowed scope?
5. Does context require step-up, explicit permission, denial, or audit?

Decision tree:

```text
Is the route public?
  |
  +-- yes -> validate input, rate-limit where relevant, return public-safe data
  |
  +-- no -> authenticated?
        |
        +-- no -> 401
        |
        +-- yes -> principal type allowed?
              |
              +-- no -> 403
              |
              +-- yes -> role/permission allowed?
                    |
                    +-- no -> 403
                    |
                    +-- yes -> resource in actor scope?
                          |
                          +-- no -> 403 or contract-safe 404
                          |
                          +-- yes -> allow and audit where needed
```

Scope rules:

- User-private reads and writes MUST include authenticated `userId`.
- Shop-owned reads and writes MUST include authenticated `shopId`.
- Shop staff permission checks MUST be enforced where permission data exists.
- Admin/global reads MUST use explicitly named admin methods and admin guards.
- System jobs MUST carry safe scope and reason metadata.
- Never rely only on route params for ownership.
- Verify ownership in the service/use-case layer before sensitive reads or
  state changes.

Bad:

```ts
orderRepository.findById(orderId);
```

Good:

```ts
orderRepository.findForUser({ userId: actor.userId, orderId });
orderRepository.findForShop({ shopId: actor.shopId, orderId });
```

---

## 8. API Boundary And Abuse Controls

API boundary responsibilities:

- Public route allowlist.
- Authentication resolution.
- Authorization policy invocation.
- Request id and correlation id.
- Request body, file, and header size limits.
- Rate limiting and abuse detection.
- Safe error responses.
- Structured access logging with redaction.
- Security headers where applicable.
- CORS allowlist for browser clients.

Rate-limit or abuse-protect:

- Login, registration, MFA, password reset, token refresh, OAuth callbacks.
- User/shop lookup, product search, order lookup, and high-cost filters.
- Cart mutation, checkout review, order creation, payment intent creation,
  coupon validation, and refund requests.
- Webhook receivers and partner callbacks.
- Email, SMS, notification, and OTP triggers.
- File upload, import, export, and report generation.

Validation errors MUST use stable codes and MUST NOT reveal internals.

---

## 9. Input Validation

Validate all external input:

- Body.
- Query.
- Path params.
- Headers.
- Cookies.
- File metadata and content.
- Queue messages.
- Webhook payloads.
- Batch import rows.
- External provider responses.
- Search, filter, sort, and pagination parameters.

Ecommerce-specific validation:

- Quantity must be positive and within configured limits.
- Money values must be calculated or verified server-side.
- Currency must be supported and consistent with product/shop/payment rules.
- Product, SPU, SKU, category, shop, cart, order, and payment references must
  exist and be in the allowed state.
- Product/SKU status and shop availability must permit purchase.
- Inventory availability must be checked server-side before reservation.
- Discount eligibility must be checked server-side.
- Shipping address and shipping method must be valid for the order context.
- User-generated content must be length-limited and sanitized before display.
- File uploads must validate type, size, and content, not only extension.

Do not trust client-provided totals, discount amounts, shipping fees, tax,
stock count, order status, payment status, or provider event data.

---

## 10. Money, Inventory, And Order Integrity

Commerce state changes must be correct, replay-safe, and auditable.

Mandatory controls:

- Transaction boundary at use-case level for multi-write workflows.
- Idempotency for retried checkout, payment, refund, webhook, import, and event
  consumer commands.
- Explicit state machines for order, payment, reservation, refund, return, and
  shipment transitions.
- Concurrency control with row locking, optimistic locking, or atomic update
  predicates where stock, usage counters, or payment state can race.
- Deterministic failure behavior and compensation paths.
- Audit or event evidence for high-risk state changes.

Use transactions for:

- Product creation when product, SKU, inventory, and media records must stay
  consistent.
- Inventory reservation and release.
- Checkout finalization and order creation.
- Payment success/failure/cancellation handling.
- Refund and return workflows.
- Discount usage counter updates.
- Bulk import finalization.
- Any operation that updates both business state and audit-relevant evidence.

---

## 11. Inventory And Reservation Security

Inventory belongs to a product/SKU and must be scoped through `shopId`.

Rules:

- Check product/SKU existence before reservation.
- Check product/SKU/shop status before reservation.
- Reservation creation must be atomic with stock availability checks.
- Reservation must have a clear expiration time.
- Expired unpaid reservations must be released safely.
- Release must be idempotent.
- Payment success must consume/finalize reserved stock exactly once.
- Payment failure, cancellation, or timeout must release reserved stock exactly
  once.
- Do not double-release or double-consume inventory.
- Prevent negative stock unless backorders are explicitly modeled.
- Record stock movements for important state changes where audit/debugging
  matters.

Bad:

```ts
const inventory = await inventoryRepo.findBySkuId(skuId);
inventory.stock -= quantity;
await inventoryRepo.save(inventory);
```

Good:

```ts
await inventoryRepo.reserveStock({
  shopId,
  skuId,
  quantity,
  reservationId,
});
```

The repository implementation should enforce scope and availability in the same
transaction or atomic predicate.

---

## 12. Cart, Checkout, And Order Security

Cart rules:

- Cart belongs to `userId`.
- Cart item product/SKU data must be revalidated during checkout.
- Cart prices are display estimates, not source of truth.
- Removed, inactive, unpublished, or out-of-stock items must be handled during
  checkout review.

Checkout rules:

- Checkout review calculates authoritative totals on the server.
- Validate product/SKU status, shop availability, stock, discount eligibility,
  shipping rules, and user ownership.
- Never trust client-provided subtotal, total, discount amount, shipping fee,
  tax, final payable amount, or payment status.
- Return enough detail for clients to explain invalid items without leaking
  private shop data.

Order rules:

- User-side order reads must be scoped by `userId`.
- Shop-side order reads must be scoped by `shopId`.
- Multi-shop orders must be modeled deliberately. One shop must not read or
  modify another shop's order lines.
- State transitions must be explicit and validated.
- Invalid transitions must return typed errors.

Example order state transitions:

```text
pending_payment -> paid -> processing -> shipped -> completed
pending_payment -> cancelled
paid -> refunded / partially_refunded
processing -> cancelled only if business rules allow it
```

---

## 13. Discounts And Coupons

Discount eligibility is calculated server-side.

Rules:

- Validate ownership, active status, time window, usage limits, per-user limits,
  product/category/shop scope, minimum order value, and user restrictions.
- Do not trust client-provided discount amounts.
- Usage counters affecting money or limits must be transactionally safe.
- Prevent double-use when a coupon is single-use or limited-use.
- Discount deletion should usually be soft delete or deactivation when it has
  order history.
- Public discount reads must not expose private shop strategy or internal notes.

---

## 14. Payment And Webhook Security

Payment provider integration is high-risk.

Rules:

- Do not store raw card data.
- Avoid bringing the application into PCI scope unless explicitly required.
- Payment intent creation must use server-calculated amount and currency.
- Do not trust client-provided payment status.
- Verify payment provider webhook signatures using the raw request body.
- Validate webhook timestamp or replay controls where supported.
- Store provider event id for duplicate detection.
- Process webhooks idempotently.
- Use transactions/locks for order payment finalization and refund state
  changes.
- A repeated payment event must not create duplicate orders, duplicate stock
  consumption, duplicate refunds, or duplicate notifications.
- Do not log full payment secrets, webhook secrets, raw card data, full webhook
  payloads, or sensitive provider tokens.

Payment success should finalize the order and consume reserved stock. Payment
failure, cancellation, expiration, or timeout should release reserved stock.

---

## 15. Events, Queues, Notifications, And Realtime

Use events/queues for slow or background workflows such as notifications,
emails, webhooks, imports, analytics, and cleanup jobs.

Rules:

- Do not block checkout/order APIs on non-critical notifications.
- Publish events after the database transaction commits, or use an outbox
  pattern.
- Event payloads must not contain secrets.
- Event payloads must include enough safe scope to process correctly, such as
  `userId`, `shopId`, `orderId`, `paymentId`, or system context.
- Event consumers must validate payloads before processing.
- Event consumers should be idempotent.
- Failed async workflows should log enough context to debug without sensitive
  data.
- Realtime subscriptions must authenticate connections and authorize
  room/channel membership.
- Clients must not choose arbitrary private room names.

Realtime notifications are not the source of truth for order, payment, or
inventory state.

---

## 16. Comments, Reviews, Messages, And User Content

User-generated content must be treated as untrusted.

Rules:

- Validate length, type, target, author, and ownership.
- Sanitize content before display.
- Review creation should be tied to a completed order if verified purchase is a
  product requirement.
- Shop replies must be scoped by `shopId`.
- User messages must be scoped by conversation participants.
- Moderation actions must be explicit and auditable.
- Do not expose private user/shop metadata in public reviews or messages.
- File or image attachments must follow upload rules.

---

## 17. File Upload, Download, Import, And Export

Files are untrusted.

Upload/import rules:

- Enforce route-specific size limits.
- Validate MIME type and content, not only extension.
- Sanitize filenames.
- Store outside the web root or in private object storage.
- Scan for malware where available.
- Parse CSV/Excel defensively with maintained libraries.
- Validate every row before mutation.
- Make batch imports idempotent.
- Produce safe error reports that do not leak other users' or shops' data.

Download/export rules:

- Require authorization for the target dataset.
- Audit bulk exports and sensitive downloads.
- Mask sensitive values where full values are not required.
- Expire export links.
- Rate-limit and monitor high-volume exports.

---

## 18. Secrets And Key Management

Secrets belong in approved secret management, not source code.

Must redact:

- `Authorization`.
- `Cookie` and `Set-Cookie`.
- API keys.
- JWTs and refresh tokens.
- Passwords and password hashes.
- Password reset tokens.
- OTP and MFA secrets.
- Private keys.
- Webhook secrets.
- OAuth tokens.
- Database URLs with passwords.
- Object storage credentials.
- Email/SMS provider credentials.
- Payment provider credentials.
- mTLS private keys and keystores.

Rules:

- Production keys must be owned, inventoried, access controlled, and rotated.
- Key rotation must be supported without code changes where practical.
- Cryptographic keys must be stored separately from encrypted data.
- Local development must use local-only throwaway secrets.
- Do not create realistic credentials in examples, fixtures, docs, or tests.

Safe placeholders:

```env
DATABASE_URL=postgresql://local_user:replace-me@localhost:5432/ecommerce
JWT_SIGNING_KEY=replace-me-local-only
STRIPE_SECRET_KEY=sk_test_replace_me
STRIPE_WEBHOOK_SECRET=whsec_replace_me
REDIS_URL=redis://localhost:6379
```

---

## 19. Cryptography

Rules:

- Use approved platform libraries only.
- Do not implement custom encryption, hashing, signing, token, random, or key
  agreement logic.
- TLS must be enforced for non-local network traffic.
- Service-to-service traffic should use mTLS or equivalent workload identity
  where appropriate.
- Passwords must use an approved adaptive hashing algorithm.
- Tokens must use approved signing algorithms and key lifecycle controls.
- Random values for security must use cryptographically secure randomness.
- Encryption at rest should follow data classification and key management
  requirements.

Do not select algorithms from snippets or convenience alone.

---

## 20. Logging, Audit, And Monitoring

Application logs must be safe by default.

Structured logs should include:

- `request_id`
- `correlation_id`
- `service`
- `route`
- `method`
- `status`
- `duration_ms`
- `actor_type`
- `actor_id`
- `user_id` when safe and available
- `shop_id` when safe and available
- safe error code

Do not log:

- Passwords, tokens, API keys, session ids, cookies, private keys.
- Full request/response bodies for auth, payment, checkout, order, webhook, or
  identity endpoints.
- Webhook secrets or raw webhook payloads.
- Raw card data, CVV, full PAN, or sensitive payment data.
- Full addresses or phone numbers unless explicitly approved and masked.
- Database URLs with passwords.

Audit these events:

- Login, logout, token refresh, token reuse detection, password reset, MFA
  challenge/reset where applicable.
- Authorization denial for sensitive resources.
- Role, permission, shop staff, admin, or service account changes.
- User/shop creation, suspension, deletion, or sensitive profile changes.
- Product approval/rejection, publish/unpublish, and admin moderation.
- Inventory adjustment, reservation, release, consume, and stock correction.
- Cart checkout, order creation, cancellation, payment success/failure, refund,
  return, and shipment state changes.
- Discount creation/update/deactivation and usage limit changes.
- Webhook acceptance/rejection and duplicate event decisions.
- Data export, import finalization, file download, and bulk reads.
- Secret, certificate, webhook, integration, and security policy changes.

Security alerts should cover spikes in 401/403/429, token reuse, cross-scope
access attempts, admin anomalies, export volume anomalies, webhook signature
failures, duplicate provider events, inventory conflicts, payment finalization
failures, queue backlogs, and critical dependency vulnerabilities.

---

## 21. Privacy And Data Minimization

Rules:

- Collect only data needed for a defined ecommerce, fraud, security,
  operational, or legal purpose.
- Do not expose more data than the actor needs.
- Keep public product/shop responses free of private notes, private seller
  metadata, and internal moderation data.
- Use synthetic or formally de-identified data outside production.
- Production data must not be copied into local development.
- Retain data according to product and legal requirements.
- Analytics and reporting should use aggregated or minimized data unless detail
  is explicitly authorized.

---

## 22. Dependency And Supply Chain Security

Dependency and library governance is defined in `LIBRARY.md`. This section sets
the minimum security bar.

Rules:

- Dependencies must come from approved repositories.
- Critical tooling and runtime dependencies should be pinned or centrally
  managed.
- Dependency changes must be reviewed for maintenance, license, vulnerability,
  transitive dependency, and data-flow impact.
- Build scripts must not download and execute unreviewed code.
- Container base images should be minimal and patched.
- Third-party SDKs must document network destinations, telemetry, data
  collection, retry behavior, and failure mode when relevant.

Do not add a dependency for a small task that the language runtime, Spring,
NestJS, or the existing stack can safely handle.

---

## 23. CI/CD, Infrastructure, And Runtime

Minimum release controls:

- Protected branches.
- Required review.
- Automated tests.
- Secret scanning.
- Dependency/container scanning where configured.
- Migration review for database changes.
- Security review for high-risk changes.
- Rollback or roll-forward plan.
- Monitoring plan for high-risk releases.

Runtime rules:

- Services run with least privilege.
- Network access should be deny-by-default where practical.
- Admin interfaces must not be publicly exposed without explicit protection.
- Database access uses dedicated service identities.
- Production configuration is externalized and access controlled.
- Backups are encrypted, access controlled, and restore tested.
- Health endpoints must not expose sensitive internals.
- Debug endpoints are disabled or protected in production.
- Object storage defaults to private.

---

## 24. Local Development Rules

- Use synthetic data only.
- Use local-only secrets only.
- Do not connect local tools to production.
- Do not store real customer exports, shop exports, payment records, order
  dumps, private keys, certificates, or provider tokens in the repository.
- Do not disable security controls globally to simplify development.
- Local overrides belong in ignored files such as `.env.local`,
  `application-local.yml`, or equivalent.
- Do not print full `.env` values.

---

## 25. Secure Development Gates

Security review is mandatory for changes involving:

- Authentication, MFA, sessions, tokens, cookies, password reset, OAuth.
- Authorization, roles, permissions, object ownership, shop isolation, user
  isolation, admin access.
- PII, shop confidential data, payment data, order history, addresses,
  exports, uploads, reviews, messages.
- Product/SKU, inventory, reservation, checkout, order, payment, refund,
  return, discount, coupon, and shipping workflows.
- Cryptography, secrets, keys, certificates, TLS.
- Webhooks, callbacks, external integrations, partner APIs, message consumers.
- Database schema involving sensitive or commerce-critical data.
- CI/CD, container, infrastructure, runtime config.
- Logging, audit, monitoring, incident response.

Required review output:

- Threats considered.
- Controls implemented.
- Negative tests added or justified.
- Residual risk.
- Monitoring or audit impact.

---

## 26. Release Security Checklist

- [ ] Public routes are explicitly allowlisted.
- [ ] Non-public routes require authentication.
- [ ] Principal type is explicit: user, shop, admin, or system.
- [ ] Authorization checks include actor, action, resource, and scope.
- [ ] User-private access is scoped server-side by `userId`.
- [ ] Shop-owned access is scoped server-side by `shopId`.
- [ ] Admin/global access is explicit and protected.
- [ ] Inputs are validated for body, query, params, headers, files, and
      messages.
- [ ] Sensitive fields are redacted from logs, errors, traces, and metrics.
- [ ] Cart, checkout, order, payment, refund, discount, and inventory commands
      are transactional where needed.
- [ ] Retriable commerce commands are idempotent.
- [ ] Concurrency control prevents oversell, double-release, double-consume,
      double-refund, and duplicate order finalization.
- [ ] Payment webhooks verify signatures and replay controls.
- [ ] Discounts and usage counters are server-authoritative and race-safe.
- [ ] File uploads/imports are validated and safe.
- [ ] Exports are authorized, audited, and protected.
- [ ] Event consumers validate payloads and handle retries safely.
- [ ] New dependencies are justified and documented in `LIBRARY.md`.
- [ ] Migrations are deterministic and reviewed.
- [ ] Negative security tests cover denial paths.
- [ ] Monitoring and alerting are considered.

---

## 27. Incident Response

When a vulnerability or security incident is suspected:

1. Preserve evidence without exposing secrets or customer/shop/payment data.
2. Identify affected service, actor population, data class, accounts, shops,
   orders, time window, deployment version, provider events, and correlation
   ids.
3. Contain active risk: disable route, revoke tokens, rotate keys, block source,
   pause job, disable integration, isolate environment, or roll back.
4. Assess commerce impact: orders, inventory, reservations, payments, refunds,
   discounts, shipments, and notifications.
5. Assess legal, customer, card network, provider, and contractual notification
   obligations through approved governance.
6. Patch or mitigate through reviewed change control.
7. Add regression tests or detection rules where feasible.
8. Redeploy with monitoring.
9. Complete root cause analysis and preventive action.

Do not disclose incident details in public issues, public logs, commit messages,
or screenshots before an approved disclosure path exists.

---

## Related

- `AGENTS.md`
- `LIBRARY.md`
- `CODING_STANDARDS.md`
- `API_REFERENCE.md`
- `BACKEND_DOCUMENTATION.md`
