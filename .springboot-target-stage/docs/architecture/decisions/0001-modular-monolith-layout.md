# ADR-0001: Capability-oriented modular monolith

- Status: Accepted
- Date: 2026-06-29

## Context

The NestJS service is a modular monolith organized around ecommerce
capabilities. The migration prompt prohibits a technical-layer-only package
tree and prohibits introducing microservices during parity.

## Decision

Use `com.itechwx.ecommerce` with top-level packages `auth`, `customer`, `shop`,
`catalog`, `inventory`, `cart`, `checkout`, `order`, `payment`, `discount`,
`comment`, `notification`, and `shared`. Each feature may contain `api`,
`application`, `domain`, and `infrastructure` packages.

Dependencies point inward. Controllers validate and map; application use cases
own workflows and transactions; plain Java domain policies own invariants;
repository ports are domain-shaped; adapters own JPA/JDBC/provider details.
JPA entities never leave infrastructure. Constructor injection is mandatory.

## Consequences

The system remains deployable as one service while feature ownership and
tenant boundaries are explicit. Cross-feature state mutation requires an
application contract or after-commit event.

