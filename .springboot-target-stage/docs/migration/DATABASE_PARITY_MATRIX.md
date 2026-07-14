# Database Parity Matrix

Evidence priority for this matrix is the schema-only PostgreSQL snapshot at
`src/main/resources/db/baseline/local-schema.sql`, followed by applied migration
SQL, then `schema.prisma`. The snapshot came from the disposable/local database
reported by Prisma as up to date; it contains no table data.

| Prisma model | Verified PostgreSQL table | Java mapping target | Scope/critical fields | Discrepancy or migration note | Phase | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `Account` | `accounts` | auth JDBC adapters; later account adapter | actor type/status/soft delete | Active access and credential lookups cast enum text explicitly | 2 | POSTGRES VERIFIED |
| `AccountAuthentication` | `account_authentication` | access-session and `JdbcLegacyCredentialReader` adapters | unique email/username; password hash/salt | Exact Node 25 Argon2id vector; active actor-scoped JDBC and reset writes executed | 2 | POSTGRES VERIFIED |
| `SocialAuthentication` | `social_authentication` | `JdbcGoogleOAuthLoginService` | provider ID/email; legacy provider-token columns | Spring persists no provider access/refresh token; verified-email link/create is transactional | 3 | POSTGRES VERIFIED |
| `AccountSecurity` | `account_security` | access permission projection and `JdbcCredentialAttemptStore` | roles/permissions arrays; MFA/lock fields | Text arrays reject invalid authorities; five failures atomically set a 15-minute lock and suspicious marker | 2 | POSTGRES VERIFIED |
| `DeviceSession` | quoted `DeviceSession` | `JdbcAuthSessionStore` | global unique `deviceId` | Explicit quoted mapping; cross-account device collision denied | 2 | POSTGRES VERIFIED |
| `KeyToken` | `key_tokens` | auth session/refresh JDBC adapters | `(auth_id,device_id)` unique; public key; refresh token/digest | Additive digest column; raw retained for NestJS rollback, digest-first Spring lookup | 2 | POSTGRES VERIFIED |
| `RefreshTokenUsed` | `refresh_tokens_used` | `JdbcRefreshTokenService` | token/digest indexes; key-token FK | Dual-write plus atomic rotation/replay invalidation; raw retained during compatibility window | 2 | POSTGRES VERIFIED |
| `PasswordReset` | `password_resets` | `JdbcPasswordResetService` | raw token/digest/hash, expiry, use state | Digest-first, one-time consume; raw retained during compatibility window | 2 | POSTGRES VERIFIED |
| `AccountProfile` | `account_profiles` | registration/OAuth JDBC adapter | phone unique; confidential fields | Created transactionally and never returned in public catalog projection | 3 | POSTGRES VERIFIED |
| `AccountPreferences` | `account_preferences` | registration/OAuth JDBC adapter | privacy/notification/currency | Source-compatible defaults and supplied values | 3 | POSTGRES VERIFIED |
| `UserBehavior` | `user_behavior` | registration/OAuth JDBC adapter | `accountId` PK; cart/orders | Exact timestamp birth date and bigint audits | 3 | POSTGRES VERIFIED |
| `ShopBusiness` | `shop_business` | registration and catalog ownership adapter | `accountId` tenant key | Every catalog mutation rechecks active business/account scope | 3 | POSTGRES VERIFIED |
| `AdminAccess` | `admin_access` | admin entity | explicit admin level/modules/territories | No live admin auth route | 2/3 | SNAPSHOT_VERIFIED |
| `AdminActivityLog` | `admin_activity_logs` | audit adapter | actor/action/target | Append-only policy to be enforced | 2+ | SNAPSHOT_VERIFIED |
| `Spu` | quoted `Spu` | `JdbcCatalogService` | mixed-case FK columns; `shopBusinessId` | Both global unique constraints are honored; cross-shop mutation denied; public query forces published/marketable | 3 | POSTGRES VERIFIED; global-name constraint retained |
| `Sku` | quoted `Sku` | `JdbcCatalogService` | price integer; SPU FK | Exact physical `num`/`skuAttribute` mappings are tested as external stock/attributes | 3 | POSTGRES VERIFIED |
| `Brand` | quoted `Brand` | `JdbcCatalogService` | unique name | Exact quoted mapping and safe duplicate conflict | 3 | POSTGRES VERIFIED |
| `Category` | quoted `Category` | `JdbcCategoryService` | nullable physical name | API requires nonblank name; public active read/admin write | 3 | POSTGRES VERIFIED |
| `CategoryClosureTable` | quoted table | `JdbcCategoryService` | composite PK | Self/ancestor closure insert and soft removal | 3 | POSTGRES VERIFIED |
| `CategoryBrand` | quoted table | association entity | composite PK | No live route | 3 | SNAPSHOT_VERIFIED |
| `CategoryAttr` | quoted table | association entity | composite PK | No live route | 3 | SNAPSHOT_VERIFIED |
| `SkuAttribute` | quoted table | SKU attribute entity | nullable values | No live route | 3 | SNAPSHOT_VERIFIED |
| `Inventory` | `inventories` | `JdbcInventoryService`, `JdbcInventoryReservationService`, catalog stock projection | unique product; mixed-case `shopBusinessId`; stock | Shop ownership rechecked; atomic predicate plus row lock prevents negative stock; inventory row is authoritative when present | 4 | POSTGRES CONCURRENCY VERIFIED |
| `ReservationInventory` | `reservation_inventories` | `JdbcInventoryReservationService` | unique `(inventory_id,user_id)`; additive nullable `order_id` | Existing row is safely reactivated; order link makes payment transitions exact; create/release/consume/expiry remain idempotent | 4/5 | POSTGRES ORDER STATE/EXPIRY VERIFIED |
| `Cart` | `carts` | `JdbcCartService` | unique user | Verified user scope on every read/write | 4 | POSTGRES OWNERSHIP VERIFIED |
| `CartProduct` | `cart_products` | `JdbcCartService` | float price; unique cart/product | Stored price is refreshed from current SKU data and remains display-only; all Java calculations use `BigDecimal` | 4 | POSTGRES VERIFIED; LEGACY_FLOAT RETAINED |
| `Discount` | `discounts` | `JdbcDiscountService` | globally unique code; shop FK; float value/minimum; user array | Global uniqueness honored; quote uses locked policy/current cart prices; atomic count and user-array update enforce concurrent limits | 4 | POSTGRES CONCURRENCY VERIFIED; LEGACY_FLOAT RETAINED |
| `Order` | `orders` | `JdbcCheckoutService`, `JdbcPaymentStore` | user/shop scope; numeric totals; state; expiry | Trailing-space discount column mapped exactly; BigDecimal calculation; PENDING/CONFIRMED/CANCELLED transitions locked and idempotent | 5 | POSTGRES TRANSACTION/STATE VERIFIED |
| `OrderItem` | `order_items` | `JdbcCheckoutService` | mixed-case FK columns; integer price | Server SKU integer price copied in same order transaction; client price ignored | 5 | POSTGRES VERIFIED |
| none (Spring additive) | `checkout_commands` | `JdbcCheckoutService` | `(user_id,idempotency_key)` unique; request fingerprint; order IDs | Concurrent replay serializes on advisory transaction lock; conflicting payload rejected | 5 | POSTGRES CONCURRENCY VERIFIED |
| none (Spring additive) | `payment_operations` | `JdbcPaymentStore` | operation/idempotency unique; amount reservation; provider object/status | Intent/customer/refund/compensation commands survive retries; cumulative refunds cannot exceed order total | 5 | POSTGRES REPLAY/LIMIT VERIFIED |
| none (Spring additive) | `payment_events` | `JdbcPaymentStore` | provider event ID PK; outcome/failure state | Verified events process once; compensation-pending survives provider failure and retries | 5 | POSTGRES REPLAY/COMPENSATION VERIFIED |
| `Comment` | `comments` | `JdbcCommentService` | author/SPU scope; status; soft delete | Verified principal is author; only active published products; owned tombstone does not modify descendant authors | 6 | POSTGRES OWNERSHIP VERIFIED |
| `CommentClosureTable` | `comment_closure` | `JdbcCommentService` | composite PK; ancestor depth | Parent must be active and belong to same product; hierarchy writes are transactional | 6 | POSTGRES CLOSURE VERIFIED |
| `NotificationThread` | `notification_threads` | `JdbcNotificationEventHandler` | unique account | Broadcast inserts select active USER accounts only | 6 | POSTGRES SCOPE VERIFIED |
| `Notification` | `notifications` | `JdbcNotificationEventHandler` | sender/thread; JSON option | Sender/target resolved from database; event side effect shares receipt transaction | 6 | POSTGRES REPLAY VERIFIED |
| none (Spring additive) | `domain_event_outbox` | `JdbcDomainEventOutbox`, `JdbcOutboxDispatcher` | event/topic/key/payload; claim lease and status | Written in catalog/discount transaction; external send occurs after commit; concurrent workers use `SKIP LOCKED` | 6 | POSTGRES ROLLBACK/CONCURRENCY VERIFIED |
| none (Spring additive) | `notification_event_receipts` | `JdbcNotificationEventHandler` | event ID PK; topic/hash/count/status | Same ID/different payload is rejected; repeated delivery creates no duplicate notifications | 6 | POSTGRES IDEMPOTENCY VERIFIED |

## Migration history assessment

| Migration | Assessment | Spring handling |
| --- | --- | --- |
| `20250213171615_init` | Creates the obsolete initial users/shops/products design. | Archive as evidence; never replay through Flyway. |
| `20250222180504_update_schema` | Drops/recreates timestamp columns and drops a table; warnings state data loss. | Archive as evidence; never replay. |
| `20251230040704_dev` | Destructively replaces the account/catalog/order/comment design and adds required columns without backfill. | Treat resulting verified schema as baseline, not this script as a safe migration. |
| Spring `V20260629000100` | Adds nullable HMAC digest shadows and partial unique indexes; does not remove raw values. | Apply forward during compatibility-first dual-run; raw removal is a separate Phase 7+ decision. |
| Spring `V20260702000100` | Adds nullable reservation order link and checkout/payment idempotency tables. | Additive and NestJS-compatible; no legacy row or column is removed or reinterpreted. |
| Spring `V20260702000200` | Adds comment read indexes, event outbox, and notification receipts. | Additive and NestJS-compatible; supports reliable optional Kafka delivery without altering legacy rows. |

## Flyway baseline plan

1. Generate an idempotency-free current-schema DDL for new disposable databases
   from the verified snapshot, excluding ownership, privileges, and
   `_prisma_migrations` data.
2. Existing databases receive an explicit reviewed `flyway baseline` at the
   chosen version. Production does not use unattended `baselineOnMigrate`.
3. Spring sets Hibernate DDL mode to `validate` outside isolated unit tests.
4. Every later schema change is a new forward-only Flyway migration. Shared
   Prisma migrations remain immutable.
5. Validate baseline and migrations on a restored synthetic/local database
   before any shared environment.

Phase 1 implementation evidence: the verified schema-only snapshot is copied
to `src/main/resources/db/baseline/local-schema.sql`; the new-empty-database
Flyway baseline is `V20251230040704__legacy_schema_baseline.sql`; Hibernate is
configured for `validate`; and automatic baselining is disabled. The
`LegacySchemaBaselineTest` asserts Flyway execution and exact legacy columns,
but was skipped on 2026-06-29 because Docker was unavailable. Database proof
therefore remains `IMPLEMENTED_NOT_EXECUTED` for the Docker-specific test.
Phase 2 additionally applied the baseline and digest migration to a disposable
local PostgreSQL 16 database and executed the auth lifecycle test without skips.
That closes the Phase 2 auth mappings, but does not replace the future restored
production-snapshot rehearsal.
Phase 4 applied the same migration chain to a new disposable PostgreSQL 16
database and executed cart ownership, discount-limit concurrency, inventory
oversell, and reservation lifecycle tests without skips.
Phase 5 applied all three migrations to another disposable PostgreSQL 16
database and executed concurrent checkout replay, rollback, payment state,
refund limit/scope, webhook replay, and compensation tests without skips.
Phase 6 applied all four migrations to a fresh disposable PostgreSQL 16
database and executed all five local compatibility suites together. Comment
ownership/closure, event scope/replay, outbox rollback/concurrent dispatch, and
multi-instance order/reservation expiry completed without failures. Only the
eight Docker-only tests were skipped.

## Backup and rollback plan

- Before a migration rehearsal, take a schema plus data backup with checksums
  using the environment's approved PostgreSQL tooling.
- Restore into a disposable database and run application plus contract tests.
- During parity, both services use only mutually compatible schema changes.
- Cutover rollback switches traffic back to NestJS before any irreversible
  schema step. Irreversible data conversion requires its own export and
  rollback ADR.
- Never use the destructive reset commands found in legacy troubleshooting
  docs against shared data.
