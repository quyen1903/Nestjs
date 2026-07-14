# Ecommerce API Reference

## Compatibility contract

```text
NestJS source base: http://localhost:3056/v1/api
Spring target base: http://localhost:3057/v1/api
```

The `/v1/api` prefix and the live response fields are retained because they are
used by the existing frontend. Examples in the legacy docs that use `/api` are
not the live route contract.

Successful Spring responses use the compatibility envelope:

```json
{
  "message": "Success",
  "statusCode": 200,
  "metadata": {},
  "requestId": "00000000-0000-0000-0000-000000000000"
}
```

`requestId` is additive. Errors use a typed safe error envelope defined in
[SECURITY.md](SECURITY.md); they are not wrapped as successes.

## Current Spring routes

| Method | Path | Access | Request/behavior | Status |
| --- | --- | --- | --- | --- |
| GET | `/v1/api/` | public | exact legacy UTF-8 HTML landing page; not JSON-wrapped | DUAL_RUNTIME_VERIFIED_PHASE_7 |
| POST | `/v1/api/auth/user/loginManual` | public | email, password, optional device ID/name; returns `user` and token pair | VERIFIED_PHASE_2 |
| POST | `/v1/api/auth/shop/login` | public | same credential/device contract; returns `shop` and token pair | VERIFIED_PHASE_2 |
| POST | `/v1/api/auth/user/handlerRefreshToken` | public refresh entry | `x-rtoken-id` header; USER token only | VERIFIED_PHASE_2 |
| POST | `/v1/api/auth/shop/handlerRefreshToken` | public refresh entry | `x-rtoken-id` header; SHOP token only | VERIFIED_PHASE_2 |
| POST | `/v1/api/auth/user/logout` | USER bearer | revokes verified account/device session | VERIFIED_PHASE_2 |
| POST | `/v1/api/auth/shop/logout` | SHOP bearer | revokes verified account/device session | VERIFIED_PHASE_2 |
| POST | `/v1/api/auth/user/forgot-password` | public | email; always returns the generic message | VERIFIED_PHASE_2 |
| POST | `/v1/api/auth/user/reset-password` | public reset entry | reset token and new password | VERIFIED_PHASE_2 |
| GET | `/v1/api/auth/user/validate-reset-token?token=...` | public reset entry | returns `valid` without token details | VERIFIED_PHASE_2 |
| POST | `/v1/api/user/registerManual` | public | transactional buyer account/profile/session creation | VERIFIED_PHASE_3 |
| POST | `/v1/api/auth/shop/register` | public | transactional seller/business/session creation | VERIFIED_PHASE_3 |
| GET | `/v1/api/auth/auth/google` | public OAuth entry | enabled provider redirect or safe 503 | IMPLEMENTED_PHASE_3 |
| GET | `/v1/api/auth/auth/google/callback` | public OAuth callback | verified-email link/create; HttpOnly token cookies | IMPLEMENTED_PHASE_3 |
| POST | `/v1/api/product/create_product` | SHOP bearer | transactional SPU/SKU create scoped to verified shop | VERIFIED_PHASE_3 |
| POST | `/v1/api/product/create_brand` | SHOP bearer | creates globally named brand | VERIFIED_PHASE_3 |
| PATCH | `/v1/api/product/{productId}` | SHOP bearer | shop-owned SPU and first-SKU compatibility update | VERIFIED_PHASE_3 |
| POST | `/v1/api/product/publish/{id}` | SHOP bearer | publishes only owned product | VERIFIED_PHASE_3 |
| POST | `/v1/api/product/unpublish/{id}` | SHOP bearer | unpublishes only owned product | VERIFIED_PHASE_3 |
| GET | `/v1/api/product/drafts/all` | SHOP bearer | owned drafts; bounded pagination | VERIFIED_PHASE_3 |
| GET | `/v1/api/product/published/all` | SHOP bearer | owned published products; bounded pagination | VERIFIED_PHASE_3 |
| GET | `/v1/api/product/search/{keySearch}` | public | published active projection only | VERIFIED_PHASE_3 |
| GET | `/v1/api/product/all` | public | published active projection only; `isPublished=false` cannot expose drafts | VERIFIED_PHASE_3 |
| GET | `/v1/api/product/productById/{productId}` | public | published active product/SKU projection | VERIFIED_PHASE_3 |
| GET | `/v1/api/product/productByName/{name}` | public | published active projections | VERIFIED_PHASE_3 |
| GET | `/v1/api/category[/{id}]` | public | active category projection | VERIFIED_PHASE_3 |
| POST/PATCH/DELETE | `/v1/api/category[/{id}]` | ADMIN/SUPER_ADMIN bearer | hierarchy-aware create/update/soft-delete | VERIFIED_PHASE_3 |
| POST | `/v1/api/cart` | USER bearer | add/increment an item using current SKU price and verified user | VERIFIED_PHASE_4 |
| POST | `/v1/api/cart/update` | USER bearer | replace verified user's cart quantities; ignores client ownership/version hints | VERIFIED_PHASE_4 |
| DELETE | `/v1/api/cart` | USER bearer | delete one verified-user item selected by body product ID | VERIFIED_PHASE_4 |
| GET | `/v1/api/cart` | USER bearer | verified user's current cart projection | VERIFIED_PHASE_4 |
| POST | `/v1/api/discount` | SHOP bearer | create validated shop-owned discount policy | VERIFIED_PHASE_4 |
| GET | `/v1/api/discount/list_product_code` | public | published eligible product projection only | VERIFIED_PHASE_4 |
| GET | `/v1/api/discount` | SHOP bearer | bounded verified-shop discount list | VERIFIED_PHASE_4 |
| POST | `/v1/api/discount/amount` | USER bearer | quote from verified user's current cart and server prices | VERIFIED_SECURITY_FIX_PHASE_4 |
| DELETE | `/v1/api/discount` | SHOP bearer | delete only verified-shop discount | VERIFIED_PHASE_4 |
| POST | `/v1/api/inventory` | SHOP bearer | create/increment stock only for an owned SKU | VERIFIED_PHASE_4 |
| POST | `/v1/api/checkout/review` | USER bearer | complete current cart selection; server product/price/stock/discount review | VERIFIED_PHASE_5 |
| POST | `/v1/api/checkout/create_order` | USER bearer | one transaction creates per-shop orders, consumes discounts, reserves stock, and clears cart; optional `Idempotency-Key` | VERIFIED_PHASE_5 |
| POST | `/v1/api/payments` | USER bearer | creates/replays Stripe intent for owned pending order; request amount/currency/customer/metadata are not authority | VERIFIED_PHASE_5 |
| GET | `/v1/api/payments/{id}` | USER/SHOP/ADMIN/SUPER_ADMIN bearer | resource-scoped safe intent projection | VERIFIED_PHASE_5 |
| POST | `/v1/api/payments/refund` | SHOP/ADMIN/SUPER_ADMIN bearer | confirmed scoped order; required `Idempotency-Key`; cumulative amount bounded | VERIFIED_PHASE_5 |
| POST | `/v1/api/payments/customers` | USER bearer | idempotent provider customer for verified active user | VERIFIED_PHASE_5 |
| POST | `/v1/api/payments/webhook` | public Stripe callback | exact raw bytes plus `Stripe-Signature`; durable event replay/compensation | VERIFIED_PHASE_5 |
| POST | `/v1/api/comment` | USER bearer | compatible `commentProductId`, `commentUserId`, `commentContent`, optional parent; verified principal is always author | VERIFIED_SECURITY_FIX_PHASE_6 |
| GET | `/v1/api/comment` | USER bearer | active published product plus optional same-product parent; safe author projection | VERIFIED_PHASE_6 |
| DELETE | `/v1/api/comment` | USER bearer | body comment/product IDs; only verified author may tombstone the selected comment | VERIFIED_SECURITY_FIX_PHASE_6 |
| GET | `/v1/api/actuator/health` | public, restricted detail | health only | IMPLEMENTED_PHASE_1 |
| GET | `/v1/api/v3/api-docs` | public during migration | generated OpenAPI JSON | IMPLEMENTED_PHASE_1 |
| GET | `/v1/api/swagger-ui.html` | public during migration | Swagger UI | IMPLEMENTED_PHASE_1 |
| any | any other path | denied | deny by default | VERIFIED_PHASE_2 |

The full NestJS controller inventory and all documented-only route candidates
are maintained in
[API_PARITY_MATRIX.md](docs/migration/API_PARITY_MATRIX.md). That matrix records
method, exact path, principal, permissions, request/response shape, expected
errors, evidence, and migration state. A route is not complete merely because
it appeared in the legacy API document.

## Authentication contract

Spring preserves verified RS256 tokens carrying `accountId`, `deviceId`,
email, and uppercase role, looks up the active per-device session/key, and
derives an explicit user/shop/admin principal. New tokens add `tokenType`,
issuer, and audience. The dormant HS256 NestJS path is not copied. Refresh
rotation is atomic, replay invalidates active sessions, and raw tokens are
dual-written only for the bounded NestJS rollback window described by ADR-0002.

Login failures use one safe response for wrong, missing, wrong-actor, and
locked accounts. Five failed attempts for a known account create a 15-minute
database-backed lock. Password reset request responses do not disclose account
existence; reset tokens expire after one hour and are single-use.

## OpenAPI

When the service is running:

```text
JSON: http://localhost:3057/v1/api/v3/api-docs
UI:   http://localhost:3057/v1/api/swagger-ui.html
```

Generated OpenAPI is evidence only for controllers actually present. It does
not replace authorization, ownership, transaction, or black-box contract
tests.

Stripe integration is disabled by default. The documented COD flow and legacy
documentation routes such as `/payments/intent`, `/payments/confirm`, payment
history, and order-history mutation are not live NestJS routes and were not
invented as parity endpoints. See the API matrix for their status.

Kafka is an internal, opt-in integration rather than a public HTTP API. The
approved topics are `product-created` and `discount-created`. New payloads use
`eventId` and `schemaVersion: 1`; the consumer validates the database target
and shop scope before atomically writing notifications and a replay receipt.
The bounded legacy product payload containing `skuId` remains accepted during
dual-run. Notification HTTP routes and rating/order-based verified-purchase
review routes exist only in historical documentation and are not represented
as live parity.

## Historical reference

The untouched former API documents are retained at:

- `docs/legacy/nestjs/source-docs/API_REFERENCE.md`
- `docs/legacy/nestjs/source-docs/apps-api-API_REFERENCE.md`

They contain useful product intent, but also stale prefixes and endpoints that
are not implemented by the live NestJS controllers.
