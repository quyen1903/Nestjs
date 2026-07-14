# Prisma-to-Java Mapping Rules

This document supplements `DATABASE_PARITY_MATRIX.md`; it does not authorize
schema changes.

| PostgreSQL/Prisma type | Java type | Rule |
| --- | --- | --- |
| `text` IDs | `String` | Preserve existing UUID/CUID strings; do not regenerate on reads. |
| `bigint` epoch audit fields | `long` at persistence boundary, converted to `Instant` by an explicit mapper | No automatic timestamp data migration. |
| `timestamp without time zone` | `LocalDateTime` at persistence boundary, converted under an explicit UTC/domain rule | Preserve stored values until a separately approved conversion. |
| `numeric(65,30)` | `BigDecimal` | Explicit precision/scale; no `double`. |
| Legacy `double precision` money | `BigDecimal` constructed from the database representation | Physical conversion needs rounding/backfill approval. |
| Integer SKU/order-item price | `long` or `BigDecimal` plus explicit currency/minor-unit policy | API mapping documents units. |
| PostgreSQL enum | Java enum plus explicit PostgreSQL mapping/converter | Reject unknown values; do not silently ordinal-map. |
| `text[]`/varchar arrays | immutable `List<String>` with explicit Hibernate/JDBC mapping | Never serialize stable relations into JSON. |
| `jsonb` | typed record/value object where stable; `JsonNode` only for genuinely flexible provider metadata | Validate before use. |
| Mixed-case/trailing-space identifiers | explicit `@Table`/`@Column` names or focused JDBC SQL | Never rely on implicit naming. |

JPA entities stay in infrastructure packages and are never controller response
types. Shop/user repository ports require non-null scope arguments.

