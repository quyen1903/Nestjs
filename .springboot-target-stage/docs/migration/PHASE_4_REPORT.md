# Phase 4 Report - Cart, Discount, Inventory, and Reservations

Date: 2026-07-02

## Outcome

Phase 4 migrates all live NestJS cart, discount, and inventory routes and adds
the internal reservation state machine required by Phase 5 checkout. It keeps
the legacy route shapes where safe while making verified principals and server
state authoritative for identity, ownership, price, stock, and discount use.

## Implemented

- User-owned cart create/update/delete/read at `/cart`. Current SKU/SPU data is
  reloaded on writes; client shop, price, version, and old-quantity fields are
  never trusted. Cart count and item state update transactionally.
- Shop-owned discount create/list/delete and public-safe eligible-product read.
  Policy validation covers date windows, type/value, active state, minimum,
  product scope, global usage, and per-user use.
- `/discount/amount` is intentionally USER-protected. Quotes use the verified
  user's persisted cart, current server prices, and `BigDecimal` arithmetic.
- Discount consumption is an internal Phase 5 operation that locks and
  revalidates the policy, then atomically updates count and per-user history.
- Shop-owned inventory initialization/increment with SKU ownership checks.
  Catalog stock reads prefer the inventory row once initialized.
- Internal inventory reservation create/release/consume/expiry operations.
  Locks are acquired in deterministic product order, stock decrement is
  atomic, holds expire after 15 minutes, and every terminal transition is
  idempotent.

No reservation shortcut was exposed as a public HTTP endpoint. Checkout owns
that composition in Phase 5.

## Intentional compatibility corrections

- NestJS accepts public client-selected identity and prices for discount
  amount calculation. Spring requires USER authentication and calculates from
  persisted/current server data (D-026).
- Legacy product reads can diverge from inventory because SKU `num` and the
  inventory table both represent stock. Spring treats initialized inventory as
  authoritative while retaining SKU `num` fallback for old rows (D-027).
- Existing reservation rows are reactivated and transitioned rather than
  blindly inserted/deleted because the physical unique key is user plus
  inventory (D-028).

## Verification

Default quality gate in staging:

```text
.\mvnw.cmd verify
Tests run: 73, failures: 0, errors: 0, skipped: 11
BUILD SUCCESS
```

Docker was unavailable, so eight Testcontainers-only tests were skipped. The
database suites were then executed against a newly created disposable local
PostgreSQL 16 database and the fixture was dropped afterward:

```text
.\mvnw.cmd test  (MIGRATION_TEST_DB_* configured for disposable fixture)
Tests run: 73, failures: 0, errors: 0, skipped: 8
BUILD SUCCESS
```

The three local-database suites all executed: auth lifecycle, catalog
compatibility, and `LocalPostgresCommerceStateTest`. Phase 4 coverage includes
cross-user cart isolation/current price refresh, cross-shop inventory denial,
two-consumer discount-limit contention, two-reservation oversell contention,
repeat release/consume, and expired hold release.

## Remaining gates

- Black-box comparison against a runnable NestJS instance remains a Phase 7
  cutover gate; the unchanged source currently has the recorded missing Prisma
  runtime dependency.
- Checkout must compose reservation and discount consume with order creation
  in one failure-safe Phase 5 transaction.
- No irreversible schema or raw-token cleanup has occurred. NestJS remains the
  rollback service.
