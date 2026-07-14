# Phase 3 Report - Accounts and Catalog

Date: 2026-06-29

## Outcome

Phase 3 migrates the live manual user/shop registration routes, Google OAuth
account creation/linking, combined product/SPU/SKU behavior, brand creation,
and category behavior. Standalone NestJS shop, brand, SPU, and SKU controllers
contain no live routes, so no unapproved endpoints were invented for them.

## Implemented

- Transactional user registration at `/user/registerManual`, including account,
  authentication, profile, behavior, security, preferences, notification
  thread, initial device session, key record, and token pair.
- Transactional shop registration at `/auth/shop/register`, including the shop
  business boundary and initial session. Global email/username/phone conflicts
  return a safe `409` instead of the source's generic gateway/server errors.
- Google authorization-code/OIDC routes at `/auth/auth/google` and
  `/auth/auth/google/callback`. OAuth is disabled by default and fails safely
  when not configured. Enabled production configuration requires an HTTPS
  callback and external credentials.
- Google identities require a verified email. New users and verified-email
  links are transactional; provider access/refresh tokens are not persisted.
  The OAuth handshake alone may use a temporary session, which is invalidated
  after callback. Bearer API chains remain stateless.
- Shop-only create/update/publish/unpublish/draft/published product routes use
  only the verified principal's account ID and recheck active `shop_business`.
- Exact verified physical mappings: `"Sku".num` is exposed as stock and
  `"Sku"."skuAttribute"` as attributes. Product/SKU creation is transactional.
- Public product list/search/detail/name routes always require active,
  marketable, published products. The legacy `isPublished=false` draft leak is
  intentionally removed. Public records contain catalog fields only, never
  account authentication/security/business-private rows.
- Brand creation preserves the live shop route and handles the global unique
  name constraint explicitly.
- Category reads are public. Former public string stubs are replaced with real
  persistence, hierarchy closure rows, soft deletion, in-use protection, and
  admin-only mutation.

## Verification

Default quality gate:

```powershell
.\mvnw.cmd verify
```

Staging result: `BUILD SUCCESS`; 70 tests, 0 failures/errors, 10 skipped.
The 60 executed tests passed. Eight skips are Docker-backed tests and two are
the environment-gated local PostgreSQL tests, which were run separately below.

The full suite was also run with both environment-gated compatibility tests
enabled against a newly created PostgreSQL 16 database, which was dropped
afterward:

```powershell
.\mvnw.cmd test
```

Result: `BUILD SUCCESS`; 70 tests, 0 failures/errors, 8 skipped. The 62
executed tests include both local PostgreSQL tests. The eight skips are only
Docker-backed duplicates because Docker is unavailable.

Database evidence includes transaction rollback boundaries, registration and
OAuth account rows, provider-token minimization, exact quoted catalog columns,
cross-shop mutation denial, draft suppression, category hierarchy, category
in-use denial, variant duplication, and publish/unpublish behavior.

## Remaining boundary

- No documented-only profile/address/shop-read routes were added; they have no
  live source implementation and remain product candidates, not parity.
- The verified PostgreSQL schema's global unique SPU name conflicts with source
  service assumptions about per-shop names. Phase 3 returns an explicit
  conflict and does not change the shared constraint.
- Kafka product/registration notifications remain Phase 6. Database commits do
  not wait for an unverified asynchronous delivery path.
- OAuth provider round-trip requires environment-owned Google credentials and
  remains a Phase 7 black-box cutover gate; local tests cover configuration,
  callback handling, and database identity behavior without fake credentials.
