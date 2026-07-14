# Phase 5 Report - Checkout, Orders, and Stripe Payments

Date: 2026-07-02

## Outcome

Phase 5 migrates the two live checkout routes and five live Stripe routes. It
composes Phase 4 cart, discount, inventory, and reservation controls into one
transactional order workflow and adds durable checkout/payment replay state.
NestJS remains unchanged and available for rollback.

COD and the order/payment routes found only in aspirational API documentation
remain unimplemented under the compatibility-first decision (D-032).

## Implemented

- `/checkout/review` recalculates current product, shop, price, discount, and
  stock state for the verified user's complete active cart using `BigDecimal`.
- `/checkout/create_order` revalidates and atomically consumes discounts,
  creates one pending order per shop, links/reserves inventory, creates order
  items, clears the cart, and completes a durable idempotency command.
- Checkout accepts an optional `Idempotency-Key`; concurrent identical calls
  return the same order IDs. Legacy callers receive a cart-generation fallback.
- Reservations have an additive nullable `order_id`, making webhook consume or
  release exact even when a user has multiple historical orders.
- `/payments` derives amount/currency from the owned pending order. Deterministic
  provider idempotency recovers a crash between Stripe creation and local save.
- `/payments/{id}` applies user/shop scope or explicit admin access and returns
  a safe intent projection without client secret.
- `/payments/refund` requires a key, shop/admin scope, confirmed order, and
  locally reserved remaining refundable amount. Different keys cannot exceed
  the cumulative order total.
- `/payments/customers` creates one idempotent provider customer per verified
  active user.
- `/payments/webhook` verifies the exact raw bytes before parsing. Provider
  event IDs are durable; success consumes reservations, failure/cancellation
  releases them, and paid-but-unfulfillable/out-of-order success is refunded
  through durable compensation state.
- Stripe Java SDK 33.1.0 is disabled by default and configured only through
  external variables. No raw card data or provider secret is persisted/logged.

## Schema migration

`V20260702000100__add_checkout_payment_idempotency.sql` is additive:

- nullable `reservation_inventories.order_id` plus FK/index;
- `checkout_commands` for request fingerprints and replayed order IDs;
- `payment_operations` for provider command IDs, refund amount reservation,
  and provider result state;
- `payment_events` for provider-event outcomes and compensation state.

NestJS ignores these additions. No legacy column or row is removed, renamed,
or reinterpreted.

## Intentional compatibility corrections

- Complete-cart selection prevents the source behavior that clears unselected
  items; shipping is validated instead of hardcoded (D-029).
- Client payment amount/currency/customer/metadata remain non-authoritative
  even though the compatible DTO accepts them (D-030).
- Refunds require `Idempotency-Key`; webhook/refund/compensation state is
  durable and cumulative refunds are bounded (D-031).
- COD and documented-only history/confirm routes remain non-live (D-032).

## Verification

Final default staging quality gate:

```text
.\mvnw.cmd verify
Tests run: 79, failures: 0, errors: 0, skipped: 12
BUILD SUCCESS
```

After adding the database suite, all tests were executed against a newly
created disposable local PostgreSQL 16 database and that fixture was dropped:

```text
.\mvnw.cmd test  (MIGRATION_TEST_DB_* points to disposable fixture)
Tests run: 77, failures: 0, errors: 0, skipped: 8
BUILD SUCCESS
```

Two production-configuration guard tests were added after that database run
and passed in the final default gate, bringing the final suite definition to
79 tests. They do not require database state.

The eight skips are Docker-only tests; all four local PostgreSQL compatibility
suites executed. `LocalPostgresCheckoutPaymentTest` proves concurrent checkout
replay, transaction rollback after a reservation write, order-linked stock,
server payment amount/currency, success/failure/late-success transitions,
compensation replay, refund replay/cumulative limit, and cross-shop denial.
`StripePaymentGatewayTest` proves a signed raw body succeeds and a one-byte
whitespace mutation fails signature verification. HTTP tests prove USER/SHOP
role boundaries and exact controller byte delivery.

## Remaining gates

- A real Stripe sandbox intent/refund/webhook E2E run is a Phase 7 environment
  gate; no real provider credential was used in automated migration tests.
- Black-box response/OpenAPI comparison awaits a runnable NestJS instance; its
  unchanged startup still has the Phase 0 Prisma runtime dependency failure.
- The frontend checkout client still uses mock/TODO mapping and requires Phase
  7 integration against the approved Spring contract.
- Pending-order expiry scheduling remains Phase 6. Webhook and payment-intent
  paths already release expired/unfulfillable reservations safely.
