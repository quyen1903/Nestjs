# ADR-0003: JPA plus focused JDBC and Flyway baseline

- Status: Accepted
- Date: 2026-06-29

## Context

The verified PostgreSQL schema contains mixed-case identifiers, a trailing
space in one column name, arrays, JSONB, bigint epochs, and discrepancies from
the current Prisma model. Existing migrations include destructive transitions.

## Decision

Use Spring Data JPA/Hibernate as the single ORM and Spring JDBC inside focused
adapters for exact locking or legacy SQL that is clearer than ORM expression.
Use explicit table and column mappings. Hibernate validates and never creates
shared schemas.

Use Flyway for forward-only changes. Existing databases receive an explicit
baseline after rehearsal. New disposable databases use a current-schema
baseline DDL. Spring never replays the historical destructive Prisma scripts.

## Consequences

The parity service can use the existing database without reinterpretation.
Any money/timestamp/identifier cleanup becomes a separate data migration with
rounding, backfill, verification, export, and rollback evidence.

