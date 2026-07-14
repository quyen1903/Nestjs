# Ecommerce Monorepo Quick Start

## Prerequisites

```bash
node --version
pnpm --version
psql --version
```

Use pnpm for this repository. The root package runs Turborepo; app code lives in
workspace packages.

## Install

```bash
pnpm install
```

## Environment

Create a root `.env` with local-only values. The API reads root `.env` first,
then `apps/api/.env` if you need app-local overrides.

```env
NODE_ENV=development
PORT=3056
DATABASE_URL=postgresql://user:password@localhost:5432/ecommerce_db
JWT_SECRET_KEY=replace-me-local-only
KAFKA_ENABLED=false
DISCORD_ENABLED=false
```

Kafka is disabled by default. Set `KAFKA_ENABLED=true` only when you are running
a local Kafka broker and want broker-backed events.

Discord delivery is disabled by default. Set `DISCORD_ENABLED=true` only with
approved local credentials; the middleware forwards request method, path, and
request ID only, never request bodies or query values.

## Database

```bash
pnpm --filter @ecommerce/api prisma migrate dev
pnpm --filter @ecommerce/api prisma db seed
```

## Run

```bash
# API only
pnpm dev:api

# Web only
pnpm dev:web

# API and web through Turborepo
pnpm dev
```

Default API base:

```text
http://localhost:3056/v1/api
```

Swagger docs:

```text
http://localhost:3056/api-docs
```

## Common Commands

```bash
# Full workspace checks
pnpm typecheck
pnpm build

# API package
pnpm --filter @ecommerce/api typecheck
pnpm --filter @ecommerce/api build
pnpm --filter @ecommerce/api test
pnpm --filter @ecommerce/api start

# Web package
pnpm --filter @ecommerce/web typecheck
pnpm --filter @ecommerce/web build
pnpm --filter @ecommerce/web dev
```

## Project Structure

```text
apps/
  api/
    src/                 NestJS API source
    prisma/              Prisma schema, migrations, generated client
    public/              API static callback pages
  web/
    app/                 Next.js App Router routes
    components/          UI components
    features/            Frontend feature modules
frontend/                Legacy static frontend demo
packages/                Future shared packages
```

## Troubleshooting

```bash
# Reinstall with the repo-local pnpm store
pnpm install

# Check Prisma migration status
pnpm --filter @ecommerce/api prisma migrate status

# Use a different API port in PowerShell
$env:PORT="3057"
pnpm dev:api
```

If `@nestjs-modules/mailer` cannot resolve `lodash`, run `pnpm install` from
the repository root. The workspace uses `publicHoistPattern` for that package's
undeclared runtime dependency.
