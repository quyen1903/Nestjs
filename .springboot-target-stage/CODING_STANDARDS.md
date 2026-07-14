# Ecommerce Coding Standards

> Entry: `AGENTS.md` -> `SECURITY.md` -> `LIBRARY.md` -> this file.
> Product source: `requirements/01_product_strategy/PRD.md` if present.
> Architecture source: `requirements/03_technical_specs/TECHSTACK.md` if present.
> Testing source: `requirements/04_testing_qa/TEST-CASES.md` if present.

---

## 1. Operating Principles

### SOLID + DRY + Shop/User Safety

| Principle | Rule |
| --- | --- |
| S | One class/module owns one reason to change. An `OrderController` is not a payment client, inventory calculator, notification sender, and audit logger. |
| O | Add new route handlers, policies, calculators, or adapters instead of growing unrelated switches. |
| L | Repository, service, and adapter interfaces must remain substitutable in tests. |
| I | Keep interfaces small. Do not expose a 20-method "manager" interface when a feature needs 2 methods. |
| D | Domain/application code depends on abstractions, not concrete HTTP clients, Redis clients, payment SDKs, or database drivers. |
| DRY | Extract duplication after the 2nd real use, but only into a module/package that has a clear owner and name. |
| Safety | Every shop-owned operation must prove `shopId` scope. Every user-private operation must prove `userId` scope. Admin bypasses require explicit admin authorization. |

### Non-negotiables

- No unvalidated external input.
- No raw secrets in code, docs, logs, screenshots, fixtures, or examples.
- No user token on shop-only APIs.
- No shop token on user-private APIs unless the business flow explicitly allows it.
- No cross-shop reads, writes, exports, jobs, inventory changes, or order actions without an explicit admin path.
- No client-provided `userId`, `shopId`, role, permission, price, stock, discount, shipping fee, or payment status as source of truth.
- No unsafe inventory read-modify-write logic.
- No silent `catch` blocks. Convert errors into typed domain/application failures or structured API errors.
- No unrelated refactors mixed into a bounded feature change.

### Preferred backend feature flow

```text
HTTP Client
  -> Controller
  -> DTO / Schema validation
  -> Guard / Policy / Permission check
  -> Application Service / Use Case
  -> Domain Policy / Calculator / Validator
  -> Repository Interface
  -> Repository Implementation
  -> Database / Redis / Queue / External Adapter
```

### Preferred frontend feature flow

```text
Route
  -> Page shell
  -> Feature component
  -> Form/table/view model
  -> TanStack Query mutation/query
  -> typed API client
  -> backend API
```

### Preferred ecommerce workflow flow

```text
User action
  -> validate request
  -> resolve authenticated actor
  -> verify ownership/scope
  -> load product/SKU/cart/order state
  -> apply domain policy
  -> run transaction when state changes must be atomic
  -> persist state
  -> emit non-critical events after commit
  -> return stable response DTO
```

---

## 2. Source Of Truth Order

When documents or implementation disagree, use this order:

1. Explicit user instruction from the project owner.
2. Security requirements in `SECURITY.md`.
3. Product requirements in `PRD.md`, detailed requirements, epics, and user stories.
4. Technical architecture in `TECHSTACK.md` and module design docs.
5. Test cases in `TEST-CASES.md`.
6. Existing implementation patterns in the current module.
7. Library guidance in `LIBRARY.md`.
8. Agent or assistant preference.

If a change contradicts a higher-priority source, update the source document in the same change or call it out clearly.

---

## 3. Repository Shape

Use the existing repository shape first. If implementation code is being added to a new workspace, prefer this structure:

```text
apps/
  api/                    # Main NestJS API or API gateway/service
  web/
    admin/                # Platform admin portal, if present
    shop/                 # Seller/shop portal, if present
    storefront/           # Buyer-facing storefront, if present
packages/
  db/                     # Database schema, migrations, seed data
  auth/                   # JWT, guards, policies, permission helpers
  shared/                 # Shared domain types and utilities
  validators/             # Zod/class-validator schemas shared by API and web
  ui/                     # Shared UI components, if frontend exists
  config/                 # ESLint, TS config, build config
docs/
  architecture/
  api/
  runbooks/
requirements/
```

Backend feature folders may use either the current project convention or this pattern:

```text
features/<feature>/
  <feature>.module.ts
  <feature>.controller.ts
  application/
    <verb>-<noun>.use-case.ts
    policies/
  domain/
    <entity>.types.ts
    <entity>.errors.ts
    <entity>.policy.ts
  infrastructure/
    <feature>.repository.ts
    <external>.adapter.ts
  dto/
    <feature>.schemas.ts
    <feature>.mapper.ts
  __tests__/
```

Rules:

- Feature folders use `kebab-case`.
- TypeScript files use `kebab-case.ts` except React components may use `PascalCase.tsx` if that is the local convention.
- Keep files focused. Split controllers, widgets, route registries, policies, and test fixtures before they become junk drawers.
- Avoid dump folders like `utils/`, `helpers/`, or generic `services/`. Name by responsibility: `inventory-reservation`, `checkout-pricing`, `order-payment`, `discount-policy`.
- Barrel files are allowed only for stable package exports. Do not hide circular dependencies behind barrels.
- Follow the existing module layout if the repository already has one.

---

## 4. Layer Rules

### Backend TypeScript

| Layer | Allowed | Forbidden |
| --- | --- | --- |
| Controller | DTO parsing, auth metadata, response mapping | SQL, Redis commands, payment SDK calls, inventory math, ownership shortcuts |
| Application service/use case | Workflow orchestration, transactions, authorization calls | HTTP response objects, framework decorators in core logic |
| Domain policy/calculator | Business rules, pure calculations, invariants | NestJS, ORM queries, Redis, external clients |
| Repository interface | Domain-shaped persistence contract | SQL strings, framework assumptions |
| Repository implementation | ORM/query builder usage, DB mappings | Request objects, raw user input, frontend DTOs |
| External adapter | Payment provider, email, SMS, storage, webhook delivery | Business policy decisions |
| Event consumer | Idempotent async processing | Trusting payloads without validation/scope |

### Frontend

| Layer | Allowed | Forbidden |
| --- | --- | --- |
| Route/page | Layout shell, route params, provider boundaries | Business calculations, ad hoc fetch calls |
| Feature component | UI composition, local UI state | Direct `fetch`, direct auth token parsing |
| Form/table model | Zod schema, field mapping, filters | Backend DTO mutation outside typed clients |
| API client | API calls, request/response typing | React state, UI behavior |

### Domain boundaries

- Auth owns identity, sessions, tokens, and permission primitives.
- User/customer modules own buyer profile and private buyer data.
- Shop modules own seller/shop profile and shop-owned settings.
- Catalog owns product, SKU, category, and public product state.
- Inventory owns stock, reservations, stock movements, and stock consistency.
- Cart owns temporary buyer selection.
- Checkout owns pricing review, discount application, shipping calculation, and reservation start.
- Order owns confirmed purchase state.
- Payment owns provider integration, payment status, idempotency, and webhook handling.
- Notification owns delivery state, not core business state.

Do not let one module silently mutate another module's critical state without an explicit use case, repository contract, or domain event.

---

## 5. Backend TypeScript Standards

### Controller rules

- One controller per resource or bounded route group.
- Validate all body, params, query, and headers before use.
- Never inject ORM clients, Redis, payment SDKs, S3/storage, email/SMS clients, or raw HTTP clients into controllers.
- Return stable response shapes. Do not leak database records directly.
- Use authenticated actor context from trusted guards/decorators.
- Do not trust IDs from the client when they can be derived from auth context.

```typescript
// Good: controller delegates to an application use case.
@Post()
async create(@Body() body: unknown, @CurrentShop() shop: AuthShop) {
  const input = CreateProductSchema.parse(body);

  const result = await this.createProduct.execute({
    input,
    actor: shop,
    shopId: shop.sub,
  });

  return ProductResponse.fromDomain(result);
}
```

### Use case rules

- A use case represents one user/system action.
- Use cases own transaction boundaries when multiple writes must succeed or fail together.
- Use cases call domain policies before persistence changes.
- Use cases return domain/result objects, not framework response types.
- Use idempotency keys for payment webhooks, retries, imports, and event consumers.
- Use explicit actor context: `user`, `shop`, `admin`, or `system`.

### Repository rules

- Every shop-owned repository method must accept `shopId` explicitly.
- Every user-private repository method must accept `userId` explicitly.
- Do not use optional scope for scoped data.
- If admins need global reads, create a separate method with a name that says so.
- Do not return columns the caller does not need.
- Use explicit order for paginated lists.
- Use cursor pagination for high-volume lists where offset becomes expensive.

```typescript
// Good: shop scope is impossible to forget.
findProductByIdForShop(params: {
  shopId: string;
  productId: string;
}): Promise<Product | null>;

// Good: user scope is impossible to forget.
findCartByUser(params: {
  userId: string;
}): Promise<Cart | null>;

// Bad: IDOR waiting to happen.
findById(id: string): Promise<Product | null>;
```

### Error handling

Use typed errors internally and map once at the HTTP boundary.

| Situation | Error code shape | HTTP |
| --- | --- | --- |
| Invalid input | `VALIDATION_ERROR` | 400 |
| Missing auth | `UNAUTHENTICATED` | 401 |
| Permission denied | `FORBIDDEN` | 403 |
| Scoped resource not found | `NOT_FOUND` | 404 |
| Duplicate unique value | `DUPLICATE_CODE` or resource-specific | 409 |
| Optimistic lock conflict | `VERSION_CONFLICT` | 409 |
| Insufficient stock | `INSUFFICIENT_STOCK` | 409 |
| Reservation expired | `RESERVATION_EXPIRED` | 409 |
| Invalid order state transition | `INVALID_ORDER_STATE` | 409 |
| Rate limit exceeded | `RATE_LIMIT_EXCEEDED` | 429 |
| Downstream unavailable | `DOWNSTREAM_UNAVAILABLE` | 503 |

Do not:

- Return stack traces to clients.
- Swallow exceptions and return partial success unless the endpoint contract says so.
- Convert everything to `500`.
- Log full tokens, request bodies with secrets, passwords, payment secrets, webhook secrets, or raw auth headers.

### Configuration

- Parse env vars at startup with a typed schema.
- Fail fast on missing production secrets.
- Keep local defaults safe and obviously non-production.
- Do not read `process.env` throughout business code. Inject typed config.
- Configuration names use uppercase snake case.
- Do not expose configuration values in logs unless they are explicitly safe.

---

## 6. Auth And Authorization Standards

### Principal types

The application may have multiple authenticated principal types:

| Principal | Scope |
| --- | --- |
| `user` | Buyer/customer account |
| `shop` | Seller/business account |
| `admin` | Platform operator |
| `system` | Internal job/event processor |

Rules:

- Keep principal type explicit in guards, decorators, and service inputs.
- Do not allow a user token to access shop-only APIs.
- Do not allow a shop token to access user-private APIs unless the endpoint explicitly allows it.
- Admin access must be explicit and protected by admin permission checks.
- System jobs must carry safe scope and reason metadata.

### JWT payloads

Current expected shapes may include:

```typescript
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

- Verify token signature, issuer/audience if configured, expiration, and subject.
- Do not trust decoded token data without verification.
- Do not accept client-provided role or permissions outside verified auth context.
- Refresh tokens must be revocable and stored server-side or tracked by secure token records.
- Passwords must be hashed with an approved password hashing algorithm.

### Authorization decision tree

```text
Is the route public?
  |
  +-- yes -> still validate input and rate limit
  |
  +-- no -> is the caller authenticated?
        |
        +-- no -> 401
        |
        +-- yes -> does principal type allow this route?
              |
              +-- no -> 403
              |
              +-- yes -> does role/permission allow action?
                    |
                    +-- no -> 403
                    |
                    +-- yes -> is the resource in caller scope?
                          |
                          +-- no -> 403 or 404 according to endpoint contract
                          |
                          +-- yes -> allow
```

---

## 7. Ecommerce Domain Standards

### Product and catalog

- Shop-created products must be scoped by `shopId`.
- Public product reads may omit auth, but must only expose public-safe fields.
- Product creation and updates require shop ownership or admin permission.
- Product status transitions must be explicit: draft, active, inactive, archived, rejected, etc.
- SKU/variant rules must be validated consistently.
- Do not expose supplier/private shop notes in public product APIs.

### Inventory

- Inventory belongs to a product/SKU and must be scoped through `shopId`.
- Stock changes must be atomic.
- Use transactions or atomic update predicates for stock decrement/increment.
- Do not rely on stale in-memory stock values.
- Record stock movements for important state changes where audit/debugging matters.
- Prevent negative stock unless the business explicitly supports backorders.

Bad:

```typescript
const inventory = await inventoryRepo.findBySkuId(skuId);
inventory.stock -= quantity;
await inventoryRepo.save(inventory);
```

Good:

```typescript
await inventoryRepo.reserveStock({
  shopId,
  skuId,
  quantity,
  reservationId,
});
```

The repository implementation should enforce scope and stock availability in the same transaction or atomic predicate.

### Cart

- Cart belongs to `userId`.
- Cart item product/SKU data must be revalidated during checkout.
- Cart prices are display estimates, not payment source of truth.
- Do not trust client-submitted cart totals.
- Removed, inactive, or out-of-stock products must be handled during checkout review.

### Checkout

- Checkout review calculates authoritative totals on the server.
- Validate product/SKU status, shop availability, stock, discount eligibility, shipping rules, and user ownership.
- Use transaction for creating reservation/order records when consistency depends on multiple writes.
- Never trust client-provided subtotal, total, discount amount, shipping fee, or final payable amount.
- Return enough detail for the client to explain invalid items without leaking private shop data.

### Inventory reservation

- Reservation creation must be atomic with stock availability checks.
- Reservation has a clear expiration time.
- Expired unpaid reservations must be released safely.
- Release must be idempotent.
- Payment success must consume/finalize the reservation exactly once.
- Payment failure, cancellation, or timeout must release the reservation exactly once.
- Do not double-release or double-consume stock.

### Order

- Order belongs to `userId` and contains shop-scoped items.
- Shop-side order reads must be scoped by `shopId`.
- User-side order reads must be scoped by `userId`.
- State transitions must be explicit and validated.
- Invalid transitions return typed errors.
- Multi-shop orders should be modeled deliberately. Do not accidentally let one shop modify another shop's order line.

Example order state transition policy:

```text
pending_payment -> paid -> processing -> shipped -> completed
pending_payment -> cancelled
paid -> refunded / partially_refunded
processing -> cancelled only if business rules allow it
```

### Discounts and coupons

- Discount eligibility is calculated server-side.
- Validate ownership, status, time window, usage limits, product/category/shop scope, minimum order value, and user restrictions.
- Do not trust client-provided discount amounts.
- Usage counters that affect money or limits must be transactionally safe.
- Prevent double-use when a coupon is single-use or limited-use.

### Payment

- Do not store raw card data.
- Do not trust client-provided payment status.
- Verify payment provider webhook signatures.
- Process payment webhooks idempotently.
- Use transactions/locks for order payment finalization and refund state changes.
- Store provider identifiers safely; do not log full sensitive payment data.
- A repeated payment event must not create duplicate orders, duplicate stock consumption, or duplicate notifications.

### Comments, reviews, and messages

- Review creation should be tied to a completed order if the business requires verified purchases.
- User-generated content must be validated and sanitized before display.
- Shop replies must be scoped by `shopId`.
- User messages must be scoped by the conversation participants.
- Do not expose private user/shop metadata in public reviews or messages.

---

## 8. Frontend Standards

### UI system

Use the existing UI stack. If the project uses shadcn/ui, Tailwind, TanStack Query, and React Hook Form, keep using them. Do not introduce a parallel design system without approval.

| Use case | Preferred |
| --- | --- |
| Primary action | Existing Button component / shadcn Button |
| Secondary/destructive action | Existing variants / AlertDialog for destructive confirmation |
| Text input | Existing Input / Form field |
| Select/combo | Existing Select / Combobox pattern |
| Data grid | TanStack Table + existing table primitives |
| Modal | Dialog / AlertDialog |
| Toast | Existing toast/sonner setup |
| Icons | Existing icon library |

### UI hard constraints

| Must | Must not |
| --- | --- |
| Use semantic Tailwind tokens or design-system variables | Inline random hex colors across components |
| Use TanStack Query or project-approved server state library | Scatter `useEffect(fetch())` across pages |
| Use Zod/class-validator-compatible schemas where shared | Trust unvalidated form data |
| Show loading/empty/error/permission states | Leave blank screens during async work |
| Keep page components as shells | Put whole feature flows in one page file |
| Use accessible labels and keyboard behavior | Build custom controls without a11y semantics |

### Frontend feature shape

```text
features/<feature>/
  api/
    <feature>.client.ts
    <feature>.queries.ts
  schemas/
    <feature>.schema.ts
  components/
    <feature>-table.tsx
    <feature>-form.tsx
  pages/
    <feature>-page.tsx
  tests/
```

### Frontend security

- Do not parse auth tokens in random components.
- Do not hide authorization only in the frontend. Backend must enforce it.
- Do not store secrets in localStorage/sessionStorage.
- Treat prices, totals, discount amounts, stock counts, and order status from the client as display-only.
- Revalidate all money and inventory logic on the server.

---

## 9. Data And Database Standards

### Schema rules

- Use the ORM/query layer already used by the current module.
- Do not mix Prisma, Drizzle, raw SQL, or another ORM inside the same bounded module unless explicitly requested.
- Use explicit column names that match API/domain naming where practical.
- Use `shop_id` on shop-owned tables.
- Use `user_id` on user-private tables.
- Prefer `created_at`, `updated_at`, and `deleted_at` timestamps where soft delete is needed.
- Store metadata in JSON/JSONB only when the shape is intentionally flexible.
- Do not use JSON/JSONB to avoid modeling core business data.
- Add check constraints for values with hard invariants when supported.

### Migration rules

- One migration per logical change.
- Include indexes in the same migration when the new query pattern requires them.
- Never modify an old migration after it has been shared. Add a new migration.
- Backfill large tables with a deliberate batching plan.
- Production-destructive migrations require a rollback or export plan.
- Avoid nullable columns for required domain invariants unless there is a migration/backfill reason.

### Query rules

| Requirement | Standard |
| --- | --- |
| Shop-owned row | Query includes `shop_id` or equivalent scoped parent |
| User-private row | Query includes `user_id` or equivalent scoped parent |
| Admin/global read | Separate explicit admin method |
| Lists | Stable order + pagination |
| Search | Use appropriate indexes where relevant |
| Inventory mutation | Atomic predicate, lock, or transaction |
| Audit trail | Record actor, action, entity type, entity id, safe old/new values where required |
| Imports | Use staging/validation before mutation for large files |

### Transaction boundaries

Use transactions for:

- Shop registration approval if it creates multiple records.
- Product creation when product, SKU, inventory, and media records must be consistent.
- Inventory reservation and release.
- Checkout review finalization when it writes reservation/order state.
- Order creation.
- Payment success/failure/cancellation handling.
- Refund and return workflows.
- Discount usage counter updates.
- Bulk import finalization.
- Any operation that updates both business state and audit logs.

---

## 10. API Contract Standards

### Request/response naming

- Follow the existing API naming convention first.
- If no convention exists, prefer `camelCase` for TypeScript-heavy APIs and keep it consistent.
- IDs are strings, usually UUID/CUID depending on the project convention.
- Timestamps are ISO 8601 strings with timezone.
- Money values must include currency context or be clearly documented as minor units.
- Pagination responses include `data` and `meta`.

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 25,
    "total": 0,
    "totalPages": 0
  }
}
```

### Error response

Use the existing error shape first. If no standard exists, prefer:

```json
{
  "statusCode": 409,
  "error": "Conflict",
  "code": "INSUFFICIENT_STOCK",
  "message": "Not enough stock is available for this item.",
  "requestId": "req_..."
}
```

### Versioning

- Public APIs should be versioned, for example `/v1/api` or `/api/v1`, following the current project convention.
- Breaking response changes require a new version or compatibility layer.
- Internal module refactors do not require API version changes.
- Do not silently change response field names used by frontend or external clients.

---

## 11. Events, Queues, And Realtime Standards

### Event rules

- Use events/queues for slow or background workflows.
- Do not block checkout/order APIs on non-critical notifications.
- Event payloads must not contain secrets.
- Event payloads must include enough scope to process safely: `userId`, `shopId`, `orderId`, or system context where relevant.
- Event consumers must validate payloads before processing.
- Event consumers should be idempotent where possible.
- Failed async workflows should be logged with enough context but without sensitive data.

### Recommended event names

Use consistent domain-style names:

```text
user.registered
shop.registered
product.created
inventory.reserved
inventory.released
order.created
order.paid
order.cancelled
payment.succeeded
payment.failed
notification.requested
message.sent
```

### Realtime/chat

- Authenticate socket connections.
- Authorize room/channel subscription.
- Do not let clients choose arbitrary room names for private conversations.
- Message reads/writes must verify participant scope.
- Realtime notifications should not become the source of truth for order/payment state.

---

## 12. Testing Standards

### Test hierarchy

| Test type | Purpose |
| --- | --- |
| Unit | Pure policies, calculators, validators, mappers |
| Integration | DB, Redis, auth, repositories, queues, payment webhook handlers |
| Contract | API request and response compatibility |
| E2E | User, shop, and admin workflows through real API paths |
| Load | Checkout, inventory, search, order creation, connection pools |
| Security | IDOR, auth bypass, permission denial, rate limits, webhook signatures |

### Required tests by feature

| Change | Required coverage |
| --- | --- |
| Auth or permissions | Unit + integration + negative authorization cases |
| Shop-owned resource | Cross-shop access denial tests |
| User-private resource | Cross-user access denial tests |
| Product/SKU | Validation + shop ownership tests |
| Inventory | Concurrent reservation/decrement tests where possible |
| Checkout/order | Success path + invalid item + insufficient stock + expired reservation |
| Payment/webhook | Signature verification + idempotency + repeated event handling |
| Discount/coupon | Valid, expired, over-limit, wrong shop/product/category, repeated use |
| Bulk import/export | Validation, partial failure, dry run, scope |
| UI form | Validation + loading/error/success states |

### Must not

- Do not skip failing tests to finish a feature.
- Do not delete tests without replacing the covered behavior.
- Do not snapshot huge UI trees as the only assertion.
- Do not mock the authorization layer out of integration tests that claim to cover API behavior.
- Do not claim tests passed if they were not run.

---

## 13. Observability Standards

### Logs

Structured logs should include:

- `request_id`
- `service`
- `route`
- `method`
- `status`
- `duration_ms`
- `user_id` when available
- `shop_id` when available
- `actor_type` when available
- `actor_id` when available
- safe error code

Do not log:

- Authorization headers.
- Passwords.
- Refresh tokens.
- JWTs.
- Webhook secrets.
- Full payment identifiers.
- Full request bodies containing sensitive data.
- Database URLs with passwords.

### Metrics

Track where practical:

- Request count and latency by route/service/status.
- Auth failures and rate limit events.
- Checkout review latency.
- Order creation success/failure count.
- Inventory reservation success/failure/expiry count.
- Payment webhook success/failure/idempotency conflict count.
- Queue job duration and failure count.
- Search latency by catalog size bucket where possible.

---

## 14. New Feature Order

Use this order unless there is a strong reason not to:

1. Read relevant requirements and test cases.
2. Identify actor type: user, shop, admin, or system.
3. Define domain types, invariants, and authorization needs.
4. Add/update validation schemas or DTOs.
5. Add repository interfaces and data mappings.
6. Add use case/application service.
7. Add route/controller/API client.
8. Add UI or integration if needed.
9. Add tests at the right levels.
10. Update docs if architecture, security, libraries, or API contracts changed.
11. Run lint/typecheck/tests/build where available.

---

## 15. Anti-patterns

| Do not | Do |
| --- | --- |
| `findById(id)` for shop-owned data | `findByIdForShop({ shopId, id })` |
| `findOrderById(orderId)` for user order history | `findOrderForUser({ userId, orderId })` |
| Controller calls payment SDK directly | Use payment use case and provider adapter |
| Controller updates inventory directly | Use inventory reservation/use case |
| Client sends final order total | Server recalculates authoritative total |
| Client sends payment status | Verify provider webhook/server callback |
| Frontend uses `fetch` in random components | Use typed API client + TanStack Query/project convention |
| One `common/utils.ts` for everything | Name packages/modules by capability |
| Reuse DTOs as domain entities | Map DTOs to domain/application models |
| Catch and ignore errors | Convert to typed failure or log and rethrow |
| Use JSON/JSONB for all business data | Model stable fields relationally |
| Public route by omission | Public route by explicit declaration |
| Background job without scope | Job payload includes `userId`, `shopId`, or system context |
| Shop query without `shopId` | Scope query by `shopId` or explicit admin method |
| User-private query without `userId` | Scope query by `userId` |

---

## 16. Final Checklist

Before a change is done:

- [ ] Actor type is explicit: user, shop, admin, or system.
- [ ] Shop scope is explicit where needed.
- [ ] User scope is explicit where needed.
- [ ] Inputs are validated.
- [ ] Authorization is enforced server-side.
- [ ] Controllers are thin.
- [ ] Business workflows live in use cases/application services.
- [ ] Inventory consistency is preserved.
- [ ] Money, discount, stock, and payment status are not trusted from the client.
- [ ] Transactions are used where multiple writes must be atomic.
- [ ] Errors are typed and mapped once.
- [ ] Logs redact sensitive data.
- [ ] Tests cover the changed risk.
- [ ] New dependencies are approved or documented in `LIBRARY.md`.
- [ ] Security-sensitive behavior is reflected in `SECURITY.md`.
- [ ] Agent-facing instructions still point to the right files.

---

## Related

- `AGENTS.md`
- `SECURITY.md`
- `LIBRARY.md`

---

## 17. Java And Spring Boot Counterparts

### Package and layer rules

- Use package-by-feature under `com.itechwx.ecommerce`.
- API records are immutable and validated with Jakarta Bean Validation.
- Controllers map HTTP only; they do not call JPA, JDBC, Redis, Kafka, Stripe,
  inventory, or discount logic directly.
- Application use cases use constructor injection and own `@Transactional`
  boundaries.
- Domain policies are plain Java without Spring/JPA/HTTP/provider annotations.
- Repository ports use domain language and non-null `userId`/`shopId` scope.
- Infrastructure adapters contain JPA entities, Spring Data repositories,
  explicit mappers, exact SQL, and provider SDK calls.
- Do not use field injection, expose JPA entities, or create generic `utils`,
  `helpers`, or catch-all `service` packages.

### Persistence and transactions

- Use explicit `@Table` and `@Column` mappings for the legacy schema.
- Hibernate uses `validate` outside isolated tests; schema changes use Flyway.
- Use `BigDecimal` and explicit currency/minor-unit rules for authoritative
  money. Do not use `float` or `double` in commerce policies.
- Put transaction boundaries on use cases. Do not hold transactions across
  avoidable network calls.
- Inventory and counters use a row lock, atomic predicate, or justified version
  check. Release/consume/finalize operations are idempotent.
- Publish non-critical events after commit or through a transactional outbox.

### Security and configuration

- One `SecurityFilterChain` allowlists public routes and denies everything else
  unless authenticated and authorized.
- Map verified claims/session data to explicit user, shop, admin, or system
  actors. Never accept actor identity from request DTOs.
- Use validated `@ConfigurationProperties`; production placeholders have no
  secret defaults. Do not scatter `System.getenv` calls through business code.
- A `OncePerRequestFilter` manages request IDs and MDC and always clears MDC.
- One `@RestControllerAdvice` maps typed errors. Production responses never
  contain stack traces or internal exception details.

### Naming and tests

- Classes/records/interfaces use `UpperCamelCase`; methods/fields use
  `lowerCamelCase`; constants use `UPPER_SNAKE_CASE`; packages are lowercase.
- Prefer names such as `FindOrderForUserUseCase` and
  `findByIdForShop(shopId, productId)` over generic managers/finders.
- Use JUnit 5, MockMvc, Spring Security Test, Mockito, and PostgreSQL
  Testcontainers at the risk-appropriate level.
- Security integration tests include allowed and denied cases. Tenant tests
  include cross-user and cross-shop denial. Commerce tests include concurrency,
  replay, rollback, and invalid transitions.
