# Phase 2 Report - Identity and Principals

Date: 2026-06-29

## Outcome

The compatibility-first Phase 2 identity slice is complete for the live
password-authenticated user and shop flows. Spring supports login, access-token
authentication, refresh rotation/reuse detection, logout, and user password
reset while the NestJS schema and raw-token columns remain usable during
dual-run. Account creation and Google account linking move with account/profile
work in Phase 3; no unsupported admin-login route was invented.

## Implemented

- Sealed user, shop, admin, and system principal types with explicit role and
  permission policies.
- RS256-only validation of legacy `accountId`/`deviceId` JWTs and PKCS#1 public
  keys, active server-side session lookup, role/account matching, expiry checks,
  weak-key denial, and refresh-as-access denial.
- New access/refresh JWTs preserve legacy claims and add `tokenType`, issuer,
  and audience. Validators accept pre-transition tokens without these additive
  claims and strictly verify them when present.
- Exact Node 25 Argon2id password compatibility using a fixed synthetic vector,
  constant-time comparison, and the same expensive missing-account path.
- User and shop login, actor-scoped logout, and the legacy `x-rtoken-id` refresh
  contract.
- Transactional device-session/key persistence and refresh rotation. Reuse,
  including concurrent reuse, revokes the account's active sessions.
- Compatibility-first HMAC-SHA-256 digest shadow columns. Spring dual-writes
  raw values for NestJS and keyed digests for Spring, then reads digest-first
  with bounded raw fallback. Raw-column removal is prohibited before Phase 7
  cutover and rollback approval.
- Random, expiring, single-use password reset tokens, generic request responses,
  SMTP delivery, digest-first lookup, Argon2id password replacement, and session
  revocation after reset.
- Persistent account lockout using `account_security`: five known-account
  failures lock login for 15 minutes, successful authentication clears the
  counter, and all failure/locked/missing cases retain the same external error.

## Database change

Forward migration `V20260629000100__add_compatibility_token_digests.sql` adds
nullable digest shadow columns and partial unique indexes to `key_tokens`,
`refresh_tokens_used`, and `password_resets`. It neither rewrites nor removes
legacy raw values. This migration is mutually compatible with the unchanged
NestJS backend.

## Verification

```powershell
.\mvnw.cmd verify
```

Result: `BUILD SUCCESS`; 59 tests, 0 failures, 0 errors, 9 skipped. The 50
executed tests passed. Eight Docker-backed PostgreSQL tests were skipped because
Docker was unavailable; the environment-gated local PostgreSQL test was skipped
in the default run.

The compatibility test was then run separately against a newly created
PostgreSQL 16 database and the database was dropped afterward:

```powershell
.\mvnw.cmd -Dtest=LocalPostgresCompatibilityTest test
```

Result: 1 test executed, 0 failures/errors/skips. It applied both Flyway
migrations and verified real SQL for credential lookup, login, access-token
validation, digest dual-write, refresh rotation and replay invalidation, logout,
password reset, two-thread refresh contention, and login lockout. The NestJS
database was not modified.

## Remaining migration boundary

- Phase 3 owns user/shop account creation, account/profile projections, and
  Google OAuth account linking/callback behavior.
- Existing-token black-box comparison remains a Phase 7 dual-backend gate
  because the recorded NestJS runtime has a pre-existing dependency startup
  failure. Static and database compatibility evidence does not waive that gate.
- Raw reusable-token columns remain until cutover verification and rollback
  approval explicitly close the compatibility window.
