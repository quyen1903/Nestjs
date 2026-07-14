# ADR-0002: Legacy token compatibility with explicit actors

- Status: Accepted and verified for the Phase 2 compatibility slice
- Date: 2026-06-29

## Context

Documentation describes `sub`, but live guards decode `accountId` and
`deviceId`, load a per-device public key, and verify RS256. User and shop tokens
carry uppercase role values. An unused HS256 configuration also exists.

## Decision

Phase 2 accepts only verified RS256 legacy access/refresh tokens whose
`accountId`, `deviceId`, role, expiry, and session record pass validation. A
validated token maps to a sealed internal actor type: user, shop, admin, or
system. The compatibility decoder does not enable HS256 fallback and does not
trust request actor fields.

Refresh rotation and reuse invalidation are atomic. The project owner selected
the compatibility-first transition: Spring writes the legacy raw value and a
keyed HMAC-SHA-256 digest to additive shadow columns, reads digest-first with
raw fallback for legacy rows, and preserves the raw columns until Phase 7
cutover and rollback verification pass. Digest-only storage and raw-column
removal require a later forward migration; existing rows are never rewritten
silently.

The access-token slice supports the legacy PKCS#1 RSA public-key representation
with bounded JDK parsing, rejects keys below 2048 bits, and compares a presented
bearer value with the legacy stored refresh token so refresh JWTs cannot be
accepted as access JWTs. This correction does not change stored token data.

## Consequences

Existing sessions can be tested across the traffic switch without making
legacy claims the domain model. Algorithm confusion, wrong-principal access,
revoked sessions, replay, and cross-tenant access receive negative tests.

The bounded dual-write window retains the legacy recoverability risk so NestJS
can remain a rollback target. The keyed digest is the Spring lookup authority;
the raw value exists only for old-backend compatibility and must not be logged
or returned except through the existing token-issuance response.
