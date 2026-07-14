# Flyway Baseline Runbook

## Scope

This runbook separates two operations that must never be confused:

1. create the verified legacy schema in a new, empty, disposable database;
2. attach Flyway metadata to an existing database without replaying legacy DDL.

The baseline version is `20251230040704`. The current forward version is
`20260629000100`, which adds nullable reusable-token digest shadow columns.

## Mandatory safeguards

- Obtain environment-owner approval before touching shared data.
- Capture schema and data backups with checksums.
- Restore backups into an isolated database first.
- Confirm the target database name and host explicitly; do not rely on shell
  history or implicit defaults.
- Never run `V20251230040704__legacy_schema_baseline.sql` over a non-empty
  existing schema.
- Keep `baseline-on-migrate: false` in every profile.
- Do not modify or replay the destructive Prisma migration history.

## New disposable database

1. Create an empty PostgreSQL 16 database using synthetic credentials.
2. Point the Spring local/test profile at it.
3. Start the application or run the PostgreSQL integration test so Flyway
   executes `V20251230040704__legacy_schema_baseline.sql`.
4. Confirm the Flyway history has two successful migrations: the baseline and
   the compatibility-token digest migration.
5. Run Hibernate validation and the Phase 1 schema assertions.
6. Destroy only the database created for this test after confirming its exact
   name and environment.

The baseline must retain exact physical identifiers such as quoted `"Sku"`,
`"Sku"."num"`, and `orders."total_discount "`.

The second migration is additive and intentionally retains raw token columns.
Do not backfill them by copying secrets through logs or shell output.

## Existing database

Do not perform this procedure autonomously in production.

1. Quiesce writes or take a consistent snapshot according to the environment's
   database policy.
2. Back up schema and data and record checksums.
3. Restore into a disposable validation database.
4. Compare the restored schema with
   `src/main/resources/db/baseline/local-schema.sql` and the database parity
   matrix. Resolve drift explicitly.
5. Use an approved Flyway CLI or controlled deployment job to run the Flyway
   `baseline` operation at version `20251230040704`. The operation adds Flyway
   history metadata; it must not execute the baseline DDL.
6. Run `validate`, Hibernate schema validation, repository integration tests,
   and contract tests against the restored database.
7. Rehearse traffic rollback to NestJS before applying the procedure to a
   shared environment.
8. Record operator, timestamp, backup/restore artifact, checksum, Flyway
   output, application version, and test report in the change record.

Exact production commands are intentionally environment-owned because a copied
connection string or database name is an unacceptable destructive-surprise
risk.

## Failure and rollback

- Before any forward data transformation, rollback is traffic switch back to
  NestJS and database restore if required.
- A failed baseline-metadata operation must be investigated; do not delete the
  Flyway history table blindly.
- If schema comparison fails, stop. Do not let Hibernate or Flyway repair the
  database automatically.
- Irreversible conversion of money, timestamps, reservation constraints, or
  legacy token data requires a separate ADR and export/backfill/rollback plan.

## Evidence checklist

- [ ] Backup and restore identifiers recorded without secrets.
- [ ] Exact target environment and disposable database confirmed.
- [ ] Schema comparison passed.
- [ ] Flyway baseline/migrate output archived.
- [ ] Hibernate validation passed.
- [ ] PostgreSQL integration tests passed, not skipped.
- [ ] NestJS rollback endpoint remained available.
- [ ] No irreversible migration is included in the cutover batch.
