# ADR-0006: Evidence-gated strangler cutover

- Status: Accepted
- Date: 2026-06-29

## Context

The frontend and PostgreSQL contract must remain stable. Compilation alone is
not parity, and the NestJS implementation must remain available through
cutover verification.

## Decision

Migrate one bounded slice at a time. Run NestJS and Spring against isolated,
equivalent synthetic data and compare normalized black-box responses. Traffic
switching occurs only after contract, security, concurrency, integration,
frontend, schema validation, backup/restore, and token/session compatibility
gates pass.

The initial traffic change is reversible at the gateway/proxy. Do not remove,
rewrite, or archive the NestJS source or Prisma migrations without explicit
owner approval after the evidence report. Avoid irreversible schema changes
during parity.

## Rollback trigger and procedure

Rollback on elevated authorization failures, cross-tenant evidence, inventory
conflicts, payment/idempotency failures, material contract divergence, or
unacceptable error/latency regression. Stop new Spring traffic, drain bounded
in-flight work, switch traffic to NestJS, verify session compatibility and core
reads, and reconcile idempotency/order/payment evidence before retrying.

## Consequences

Both implementations coexist longer, but rollback stays practical. Cutover
requires owner approval and cannot be inferred from a green build.

