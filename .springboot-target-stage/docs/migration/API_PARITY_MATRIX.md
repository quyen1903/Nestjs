# API Parity Matrix

Approved compatibility prefix: `/v1/api`. Phase 7 live capture confirms both
NestJS and Spring expose 41 OpenAPI paths and 50 operations. After normalizing
the shared context prefix, the method/path sets have zero missing or extra
operations.

The live success envelope is `{message,statusCode,metadata}`. The frontend also
accepts `{message,code,data}`. Spring parity initially preserves the live
envelope. `PENDING` never means implemented.

## Spring foundation routes

| Method | Path | Public/protected | Evidence | Status |
| --- | --- | --- | --- | --- |
| GET | `/v1/api/actuator/health` | Public; details restricted | Foundation security test plus Phase 7 disposable-database runtime HTTP 200/UP | RUNTIME_VERIFIED_PHASE_7 |
| GET | `/v1/api/v3/api-docs` | Public during migration | Phase 7 runtime capture: 41 paths/50 operations; exact NestJS method/path match | RUNTIME_VERIFIED_PHASE_7 |
| GET | `/v1/api/swagger-ui.html` | Public during migration | Security configuration and springdoc configuration; runtime capture pending | IMPLEMENTED_PHASE_1 |
| any | unmatched/business path | Denied to anonymous and authenticated callers | `FoundationSecurityTest` negative tests | VERIFIED_PHASE_1 |

## Live controller routes

| Method | Path | Public/protected | Principal | Permission | Request schema | Success schema | Error codes | Nest test | Spring test | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/v1/api/` | Public | none | none | none | legacy HTML, unwrapped | 404 only if packaged asset is absent | none | `FoundationSecurityTest.servesLegacyHomePageWithoutJsonEnvelope`; dual-runtime body comparison | DUAL_RUNTIME_VERIFIED_PHASE_7 |
| GET | `/v1/api/auth/auth/google` | Public OAuth entry | none | none | OAuth query | Google redirect when configured; safe 503 otherwise | provider/config errors | none | config/unavailable route tests | SPRING_IMPLEMENTED_PHASE_3; PROVIDER_BLACK_BOX_PENDING |
| GET | `/v1/api/auth/auth/google/callback` | Public callback | verified Google identity | none | authorization response | HttpOnly cookies + fixed HTML | provider/identity errors | none | success handler + PostgreSQL account-link tests | SPRING_IMPLEMENTED_PHASE_3; PROVIDER_BLACK_BOX_PENDING |
| POST | `/v1/api/auth/user/loginManual` | Public | user credentials | none | compatible email/password/device fields | user id + access/refresh tokens | 400/401/503 | none | `AuthControllerSecurityTest`; `LocalPostgresCompatibilityTest` | SPRING_VERIFIED_PHASE_2; BLACK_BOX_PENDING |
| POST | `/v1/api/auth/user/logout` | Protected | user | `USER`; verified account/device | bearer token | update count | 401/403 | none | `AuthControllerSecurityTest.logoutRequiresMatchingPrincipalAndUsesVerifiedScope`; local PostgreSQL test | SPRING_VERIFIED_PHASE_2; BLACK_BOX_PENDING |
| POST | `/v1/api/auth/user/handlerRefreshToken` | Public refresh entry | user session | verified USER refresh claims | `x-rtoken-id` | rotated token pair; internal rows intentionally excluded (D-021) | 400/401/403 | none | `AuthControllerSecurityTest`; JDBC lifecycle/local PostgreSQL tests | SPRING_VERIFIED_PHASE_2; BLACK_BOX_PENDING |
| POST | `/v1/api/auth/user/forgot-password` | Public | none | none | compatible email | generic message | 400 | none | `AuthControllerSecurityTest`; JDBC lifecycle/local PostgreSQL tests | SPRING_VERIFIED_SECURITY_FIX; BLACK_BOX_PENDING |
| POST | `/v1/api/auth/user/reset-password` | Public | reset subject | none | compatible token/password | message | 400 | none | `AuthControllerSecurityTest`; JDBC lifecycle/local PostgreSQL tests | SPRING_VERIFIED_SECURITY_FIX; BLACK_BOX_PENDING |
| GET | `/v1/api/auth/user/validate-reset-token` | Public | reset subject | none | `token` query | `{valid}` | safe false/400 validation | none | `AuthControllerSecurityTest`; JDBC lifecycle/local PostgreSQL tests | SPRING_VERIFIED_SECURITY_FIX; BLACK_BOX_PENDING |
| POST | `/v1/api/auth/shop/login` | Public | shop credentials | none | compatible email/password/device fields | shop id + access/refresh tokens | 400/401/503 | none | `AuthControllerSecurityTest`; shared login/credential tests | SPRING_VERIFIED_PHASE_2; BLACK_BOX_PENDING |
| POST | `/v1/api/auth/shop/logout` | Protected | shop | `SHOP`; verified account/device | bearer token | update count | 401/403 | none | `AuthControllerSecurityTest.logoutRequiresMatchingPrincipalAndUsesVerifiedScope` | SPRING_VERIFIED_PHASE_2; BLACK_BOX_PENDING |
| POST | `/v1/api/auth/shop/handlerRefreshToken` | Public refresh entry | shop session | verified SHOP refresh claims | `x-rtoken-id` | rotated token pair; internal rows intentionally excluded (D-021) | 400/401/403 | none | `AuthControllerSecurityTest`; refresh verifier/lifecycle tests | SPRING_VERIFIED_PHASE_2; BLACK_BOX_PENDING |
| POST | `/v1/api/auth/shop/register` | Public | none | none | compatible shop registration | shop id + tokens | 400/409/503 | none | auth HTTP + PostgreSQL transaction tests | SPRING_VERIFIED_PHASE_3; BLACK_BOX_PENDING |
| POST | `/v1/api/user/registerManual` | Public | none | none | compatible user registration | minimal user/thread ids + tokens | 400/409/503 | none | auth HTTP + PostgreSQL transaction tests | SPRING_VERIFIED_PHASE_3; BLACK_BOX_PENDING |
| POST | `/v1/api/product/create_product` | Protected | shop | `SHOP` + active business | validated SPU/SKU | SPU + SKU | 400/401/403/409 | none | catalog HTTP/PostgreSQL tests | SPRING_VERIFIED_PHASE_3; BLACK_BOX_PENDING |
| POST | `/v1/api/product/create_brand` | Protected | shop | `SHOP` + active business | validated brand | brand | 400/401/403/409 | none | catalog HTTP/PostgreSQL tests | SPRING_VERIFIED_PHASE_3; BLACK_BOX_PENDING |
| PATCH | `/v1/api/product/{productId}` | Protected | shop | `SHOP` + ownership | bounded partial SPU/SKU fields | SPU + selected first SKU | 400/401/403/404/409 | none | catalog PostgreSQL cross-shop test | SPRING_VERIFIED_PHASE_3; BLACK_BOX_PENDING |
| POST | `/v1/api/product/publish/{id}` | Protected | shop | `SHOP` + ownership | path id | safe product projection | 401/403/404 | none | catalog PostgreSQL cross-shop test | SPRING_VERIFIED_PHASE_3; BLACK_BOX_PENDING |
| POST | `/v1/api/product/unpublish/{id}` | Protected | shop | `SHOP` + ownership | path id | safe product projection | 401/403/404 | none | catalog PostgreSQL test | SPRING_VERIFIED_PHASE_3; BLACK_BOX_PENDING |
| GET | `/v1/api/product/drafts/all` | Protected | shop | `SHOP` + ownership | bounded `skip`,`take` | owned SPU/SKU list | 400/401/403 | none | catalog HTTP/PostgreSQL tests | SPRING_VERIFIED_PHASE_3; BLACK_BOX_PENDING |
| GET | `/v1/api/product/published/all` | Protected | shop | `SHOP` + ownership | bounded `skip`,`take` | owned SPU/SKU list | 400/401/403 | none | catalog HTTP/PostgreSQL tests | SPRING_VERIFIED_PHASE_3; BLACK_BOX_PENDING |
| GET | `/v1/api/product/search/{keySearch}` | Public | none | none | bounded path search | published public projection | 400 | none | catalog PostgreSQL test | SPRING_VERIFIED_SECURITY_FIX; BLACK_BOX_PENDING |
| GET | `/v1/api/product/all` | Public | none | none | bounded pagination; legacy flag accepted but cannot expose drafts | published public projection | 400 | none | catalog HTTP/PostgreSQL draft test | SPRING_VERIFIED_SECURITY_FIX; BLACK_BOX_PENDING |
| GET | `/v1/api/product/productById/{productId}` | Public | none | none | path id | published public product/SKU projection; inventory/private author graph excluded | 404 | none | catalog PostgreSQL test | SPRING_VERIFIED_SECURITY_FIX; BLACK_BOX_PENDING |
| GET | `/v1/api/product/productByName/{name}` | Public | none | none | bounded path text | published public projections | 400 | none | catalog service tests | SPRING_VERIFIED_SECURITY_FIX; BLACK_BOX_PENDING |
| POST | `/v1/api/category` | Protected correction | admin | `ADMIN`/`SUPER_ADMIN` | name/sort/optional parent | category | 400/401/403/404/409 | none | catalog HTTP/PostgreSQL hierarchy tests | INTENTIONAL_SECURITY_BREAK_VERIFIED |
| GET | `/v1/api/category` | Public | none | none | none | active category list | none | none | catalog HTTP/PostgreSQL tests | SPRING_VERIFIED_PHASE_3 |
| GET | `/v1/api/category/{id}` | Public | none | none | string id | active category | 404 | none | catalog service test | SPRING_VERIFIED_PHASE_3 |
| PATCH | `/v1/api/category/{id}` | Protected correction | admin | `ADMIN`/`SUPER_ADMIN` | name/sort patch | category | 400/401/403/404 | none | catalog HTTP security test | INTENTIONAL_SECURITY_BREAK_VERIFIED |
| DELETE | `/v1/api/category/{id}` | Protected correction | admin | `ADMIN`/`SUPER_ADMIN` | string id | removal result | 401/403/404/409 | none | PostgreSQL in-use denial | INTENTIONAL_SECURITY_BREAK_VERIFIED |
| POST | `/v1/api/cart` | Protected | user | `USER`; verified user owns cart | validated product; client price/shop hints ignored | cart item/current server snapshot | 400/401/403/404 | HTTP actor test; PostgreSQL ownership/current-price test | `CommerceControllerSecurityTest`; `LocalPostgresCommerceStateTest` | SPRING_VERIFIED_PHASE_4; BLACK_BOX_PENDING |
| POST | `/v1/api/cart/update` | Protected | user | `USER`; verified user owns cart | bounded validated items; client version/old quantity ignored | current cart items | 400/401/403/404 | HTTP actor test; PostgreSQL ownership test | Phase 4 tests | SPRING_VERIFIED_PHASE_4; BLACK_BOX_PENDING |
| DELETE | `/v1/api/cart` | Protected | user | `USER`; verified user owns cart | body `productId` | deleted flag and count | 401/403/404 | HTTP actor test; PostgreSQL ownership test | Phase 4 tests | SPRING_VERIFIED_PHASE_4; BLACK_BOX_PENDING |
| GET | `/v1/api/cart` | Protected | user | `USER`; verified user owns cart | none | current cart items | 401/403 | HTTP actor test; PostgreSQL ownership test | Phase 4 tests | SPRING_VERIFIED_PHASE_4; BLACK_BOX_PENDING |
| POST | `/v1/api/discount` | Protected | shop | `SHOP`; policy products owned by verified shop | validated dates/type/value/scope/limits | discount | 400/401/403/409 | HTTP actor test; PostgreSQL policy test | Phase 4 tests | SPRING_VERIFIED_PHASE_4; BLACK_BOX_PENDING |
| GET | `/v1/api/discount/list_product_code` | Public | none | published-safe projection only | bounded `shopId`,`limit`,`page`,`code` | eligible published products | 400/404 | PostgreSQL projection test | Phase 4 tests | SPRING_VERIFIED_PHASE_4; BLACK_BOX_PENDING |
| GET | `/v1/api/discount` | Protected | shop | verified `SHOP` scope | bounded `limit`,`page` | scoped discounts | 401/403 | HTTP actor test; PostgreSQL scope test | Phase 4 tests | SPRING_VERIFIED_PHASE_4; BLACK_BOX_PENDING |
| POST | `/v1/api/discount/amount` | Protected security correction | user | verified `USER`; own persisted cart | shop/code/product selectors; client user/price/quantity ignored | BigDecimal totals | 400/401/403/404/409 | HTTP attacker-body test; PostgreSQL current-price/concurrency test | `CommerceControllerSecurityTest`; `LocalPostgresCommerceStateTest`; D-026 | SPRING_VERIFIED_SECURITY_FIX; BLACK_BOX_PENDING |
| DELETE | `/v1/api/discount` | Protected | shop | verified `SHOP` owns discount | body `discountCode` | delete result | 401/403/404 | HTTP actor test; PostgreSQL scope test | Phase 4 tests | SPRING_VERIFIED_PHASE_4; BLACK_BOX_PENDING |
| POST | `/v1/api/inventory` | Protected | shop | `SHOP` + SKU ownership | positive quantity and SKU | inventory | 400/401/403/404/409 | HTTP actor test; cross-shop PostgreSQL test | `CommerceControllerSecurityTest`; `LocalPostgresCommerceStateTest` | SPRING_VERIFIED_PHASE_4; BLACK_BOX_PENDING |
| POST | `/v1/api/checkout/review` | Protected | user | `USER`; verified full-cart ownership | compatible shop/product/discount selection; client price/shop hints ignored | BigDecimal per-shop/aggregate review | 400/401/403/404/409 | source ownership unit | HTTP actor + PostgreSQL authoritative review | SPRING_VERIFIED_PHASE_5; BLACK_BOX_PENDING |
| POST | `/v1/api/checkout/create_order` | Protected | user | `USER`; verified full-cart ownership | compatible selection; optional `Idempotency-Key`; additive shipping address | per-shop pending orders summary | 400/401/403/404/409 | source ownership unit | concurrent replay/rollback/PostgreSQL test | SPRING_VERIFIED_PHASE_5; BLACK_BOX_PENDING |
| POST | `/v1/api/payments` | Protected | user | `USER` + pending unexpired order ownership | `CreatePaymentDto`; client amount/currency/customer/metadata ignored as authority | Stripe intent fields | 400/401/403/404/409/503 | guard unit | HTTP scope + fake-provider/PostgreSQL idempotency | SPRING_VERIFIED_PHASE_5; PROVIDER_E2E_PENDING |
| GET | `/v1/api/payments/{id}` | Protected | user/shop/admin | role + user/shop resource scope | payment intent id | safe intent projection without client secret | 401/403/404/503 | guard unit | HTTP role + PostgreSQL cross-shop denial | SPRING_VERIFIED_PHASE_5; PROVIDER_E2E_PENDING |
| POST | `/v1/api/payments/refund` | Protected | shop/admin | shop ownership or explicit admin | `RefundPaymentDto` + required `Idempotency-Key` | refund id/status | 400/401/403/404/409/503 | guard unit | replay/cross-shop/cumulative-limit PostgreSQL test | SPRING_VERIFIED_SECURITY_FIX; PROVIDER_E2E_PENDING |
| POST | `/v1/api/payments/customers` | Protected | user | verified active `USER` | none; request cannot choose account | customer id | 401/403/404/503 | guard unit | HTTP role + durable command implementation | SPRING_IMPLEMENTED_PHASE_5; PROVIDER_E2E_PENDING |
| POST | `/v1/api/payments/webhook` | Public signed webhook | Stripe | exact raw-body signature before parse | raw JSON bytes + `Stripe-Signature` | received/replayed/outcome inside compatibility envelope | 400/503 | public-guard unit | exact-byte signature + durable event/compensation PostgreSQL tests | SPRING_VERIFIED_PHASE_5; PROVIDER_E2E_PENDING |
| POST | `/v1/api/comment` | Protected | user | verified `USER`; principal is author | compatible product/user/content/parent body; legacy `commentUserId` ignored as authority | safe comment/author projection | 400/401/403/404 | none | `CommentControllerSecurityTest`; `LocalPostgresPhase6Test` | SPRING_VERIFIED_SECURITY_FIX_PHASE_6; BLACK_BOX_PENDING |
| GET | `/v1/api/comment` | Protected | user | verified `USER` | bounded product and optional parent query | active root/direct-child comments with safe author projection | 400/401/403/404 | none | Phase 6 HTTP/PostgreSQL tests | SPRING_VERIFIED_PHASE_6; BLACK_BOX_PENDING |
| DELETE | `/v1/api/comment` | Protected | user | verified `USER`; author ownership | comment and product IDs | owned tombstone result; descendants unchanged | 400/401/403/404 | none | cross-user denial and PostgreSQL descendant test | SPRING_VERIFIED_SECURITY_FIX_PHASE_6; BLACK_BOX_PENDING |

## Documented routes without matching live route

These are retained contract candidates, not production parity. Equivalent live
behavior is noted where one exists under a different path.

| Method | Path | Public/protected | Principal | Permission | Request schema | Success schema | Error codes | Nest test | Spring test | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/v1/api/auth/register` | Public | none | none | documented user registration | documented `data` envelope | 400/409 | none | pending | ROUTE_MISMATCH: live `/user/registerManual` |
| POST | `/v1/api/auth/login` | Public | credentials | none | email/password | documented token envelope | 401/404 | none | pending | ROUTE_MISMATCH: live `/auth/user/loginManual` |
| POST | `/v1/api/auth/refresh-token` | Protected refresh | user | none | body refresh token | access token | 401 | none | pending | ROUTE_MISMATCH/header semantics differ |
| POST | `/v1/api/auth/logout` | Protected | user | user | bearer | message | 401 | none | pending | ROUTE_MISMATCH |
| POST | `/v1/api/auth/verify-email` | Public token | user | none | undocumented | message | unstable | none | pending | PLANNED/UNIMPLEMENTED |
| POST | `/v1/api/auth/forgot-password` | Public | none | none | email | generic message | 400 | none | pending | ROUTE_MISMATCH |
| POST | `/v1/api/auth/reset-password` | Public token | none | none | token/password | message | 400 | none | pending | ROUTE_MISMATCH |
| POST | `/v1/api/shop-auth/register` | Public | none | none | documented shop body | token envelope | 400/409 | none | pending | ROUTE_MISMATCH |
| POST | `/v1/api/shop-auth/login` | Public | credentials | none | email/password | token envelope | 401 | none | pending | ROUTE_MISMATCH |
| POST | `/v1/api/shop-auth/refresh-token` | Protected refresh | shop | none | refresh token | token envelope | 401 | none | pending | ROUTE_MISMATCH |
| POST | `/v1/api/shop-auth/logout` | Protected | shop | shop | bearer | message | 401/403 | none | pending | ROUTE_MISMATCH |
| GET | `/v1/api/users/profile` | Protected | user | self | none | profile | 401/404 | none | pending | PLANNED/UNIMPLEMENTED |
| PUT | `/v1/api/users/profile` | Protected | user | self | profile fields | profile | 400/401 | none | pending | PLANNED/UNIMPLEMENTED |
| GET | `/v1/api/users/addresses` | Protected | user | self | none | address list | 401 | none | pending | PLANNED/UNIMPLEMENTED |
| POST | `/v1/api/users/addresses` | Protected | user | self | address | address | 400/401 | none | pending | PLANNED/UNIMPLEMENTED |
| PUT | `/v1/api/users/addresses/{id}` | Protected | user | ownership | address patch | address | 400/401/404 | none | pending | PLANNED/UNIMPLEMENTED |
| DELETE | `/v1/api/users/addresses/{id}` | Protected | user | ownership | path id | message | 401/404 | none | pending | PLANNED/UNIMPLEMENTED |
| GET | `/v1/api/products` | Public | none | none | filters/page | product page | 400 | none | pending | ROUTE_MISMATCH: live `/product/all` |
| GET | `/v1/api/products/search` | Public | none | none | `q` + filters | search result | 400 | none | pending | ROUTE_MISMATCH |
| GET | `/v1/api/products/trending` | Public | none | none | limit | products | 400 | none | pending | PLANNED/UNIMPLEMENTED |
| GET | `/v1/api/products/{id}` | Public | none | none | path id | public product | 404 | none | pending | ROUTE_MISMATCH |
| POST | `/v1/api/products` | Protected | shop | ownership | documented product body | product | 400/401/409 | none | pending | ROUTE_MISMATCH |
| PUT | `/v1/api/products/{id}` | Protected | shop | ownership | product patch | product | 403/404 | none | pending | ROUTE_MISMATCH: live PATCH |
| DELETE | `/v1/api/products/{id}` | Protected | shop | ownership | path id | message | 403/404 | none | pending | PLANNED/UNIMPLEMENTED |
| POST | `/v1/api/cart/items` | Protected | user | self | product/variant/quantity | cart summary | 400/404/409 | none | pending | ROUTE_MISMATCH |
| PUT | `/v1/api/cart/items/{id}` | Protected | user | ownership | quantity | cart | 404/409 | none | pending | ROUTE_MISMATCH |
| DELETE | `/v1/api/cart/items/{id}` | Protected | user | ownership | path id | cart | 404 | none | pending | ROUTE_MISMATCH |
| DELETE | `/v1/api/cart` | Protected | user | self | none | message | 401 | none | pending | SEMANTIC_MISMATCH: live deletes one body-selected item |
| POST | `/v1/api/cart/apply-discount` | Protected | user | self | coupon code | cart totals | 400/404/409 | none | pending | PLANNED/UNIMPLEMENTED |
| DELETE | `/v1/api/cart/remove-discount` | Protected | user | self | none | cart | 401 | none | pending | PLANNED/UNIMPLEMENTED |
| POST | `/v1/api/checkout` | Protected | user | self | address/shipping/payment | order | 400/401/409 | none | pending | ROUTE_MISMATCH |
| GET | `/v1/api/checkout/orders` | Protected | user | self | page/status | order page | 401 | none | pending | SERVICE_EXISTS_ROUTE_MISSING |
| GET | `/v1/api/checkout/orders/{id}` | Protected | user | ownership | path id | order detail | 401/404 | none | pending | SERVICE_EXISTS_ROUTE_MISSING |
| POST | `/v1/api/payments/intent` | Protected | user | order ownership | order/amount/currency | intent | 400/404 | none | pending | ROUTE_MISMATCH; client amount is not authoritative |
| POST | `/v1/api/payments/confirm` | Protected | user | order ownership | intent id | status | 400/404 | none | pending | PLANNED/UNIMPLEMENTED; webhook is authority |
| GET | `/v1/api/payments/history` | Protected | user | self | page | payment list | 401 | none | pending | PLANNED/UNIMPLEMENTED |
| GET | `/v1/api/discounts` | Public/optional | none | public-safe | limit | discounts | unstable | none | pending | ROUTE_MISMATCH |
| POST | `/v1/api/discounts` | Protected | shop/admin | ownership | discount | discount | 400/409 | none | pending | ROUTE_MISMATCH |
| PUT | `/v1/api/discounts/{id}` | Protected | shop/admin | ownership | discount patch | discount | 400/404 | none | pending | PLANNED/UNIMPLEMENTED |
| DELETE | `/v1/api/discounts/{id}` | Protected | shop/admin | ownership | path id | message | 404 | none | pending | ROUTE_MISMATCH |
| POST | `/v1/api/discounts/{code}/validate` | Protected | user | self | cart total | validation result | 400 | none | pending | ROUTE_MISMATCH; server must calculate cart total |
| GET | `/v1/api/comments/product/{productId}` | Public/optional | none | public-safe | page/sort | review page | 400 | none | pending | ROUTE_MISMATCH; live read is protected |
| POST | `/v1/api/comments` | Protected | user | verified purchase | review body | review | 400/403/409 | none | pending | ROUTE_MISMATCH/FEATURE_GAP |
| PUT | `/v1/api/comments/{id}` | Protected | user | ownership | review patch | review | 403/404 | none | pending | PLANNED/UNIMPLEMENTED |
| DELETE | `/v1/api/comments/{id}` | Protected | user | ownership | path id | message | 403/404 | none | pending | ROUTE_MISMATCH |
| POST | `/v1/api/comments/{id}/helpful` | Protected | user | self | path id | count | 404 | none | pending | PLANNED/UNIMPLEMENTED |
| GET | `/v1/api/notifications` | Protected | user | self | page/unread | notification page | 401 | none | pending | PLANNED/UNIMPLEMENTED |
| PUT | `/v1/api/notifications/{id}/read` | Protected | user | ownership | path id | message | 401/404 | none | pending | PLANNED/UNIMPLEMENTED |
| PUT | `/v1/api/notifications/read-all` | Protected | user | self | none | message | 401 | none | pending | PLANNED/UNIMPLEMENTED |
| GET | `/v1/api/shops/{shopId}` | Public/optional | none | public-safe | path id | shop profile | 404 | none | pending | PLANNED/UNIMPLEMENTED |
| GET | `/v1/api/shops/{shopId}/products` | Public/optional | none | public-safe | page/sort | product page | 404 | none | pending | PLANNED/UNIMPLEMENTED |
| POST | `/v1/api/shops/{shopId}/follow` | Protected | user | self | path id | message | 401/404 | none | pending | PLANNED/UNIMPLEMENTED |
| DELETE | `/v1/api/shops/{shopId}/follow` | Protected | user | self | path id | message | 401/404 | none | pending | PLANNED/UNIMPLEMENTED |
| GET | `/v1/api/inventory` | Protected | shop | shop scope | filters | inventory | 401/403 | none | pending | DOCUMENTED_ONLY |
| POST | `/v1/api/inventory/reserve` | Internal | system/user workflow | scope | reservation request | reservation | 409 | none | pending | DOCUMENTED_ONLY; no public internal shortcut |
| POST | `/v1/api/inventory/release` | Internal | system | scope/idempotency | release request | result | 409 | none | pending | DOCUMENTED_ONLY |
| PUT | `/v1/api/inventory/{id}/adjust` | Protected | shop/admin | ownership/permission | quantity/reason | inventory | 400/403/404 | none | pending | DOCUMENTED_ONLY |

## Contract gate

A row becomes `COMPLETE` only when its Spring test and a black-box comparison
are linked. Static equivalence is insufficient. Nondeterministic identifiers,
timestamps, request IDs, and provider IDs may be normalized only by the
contract harness configuration.
