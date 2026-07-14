# Ecommerce Monorepo

NestJS API plus Next.js web app managed with pnpm workspaces and Turborepo.

## Workspace Layout

```text
apps/
  api/     NestJS ecommerce backend
  web/     Next.js storefront/dashboard frontend
frontend/  Legacy static frontend demo
```

The root package is only the monorepo orchestrator. App-specific source,
configs, and dependencies live in each app package.

## Setup

```bash
pnpm install
```

The API reads environment variables from the repository root `.env`, with
`apps/api/.env` available as an app-local override.

## Common Commands

```bash
# Run both apps in development
pnpm dev

# Run only the API
pnpm dev:api
pnpm start

# Run only the web app
pnpm dev:web

# Verify and build everything
pnpm typecheck
pnpm build

# Package-scoped commands
pnpm --filter @ecommerce/api build
pnpm --filter @ecommerce/web build
```

## API Notes

- API source: `apps/api/src`
- Prisma schema: `apps/api/prisma/schema.prisma`
- Generated Prisma client: `apps/api/prisma/generated/prisma`
- Default API base: `http://localhost:3056/v1/api`
- Kafka is disabled by default. Set `KAFKA_ENABLED=true` only when you want broker-backed events.

## Kafka, Optional

```powershell
$env:KAFKA_ENABLED="true"

cd C:\kafka\
.\bin\windows\zookeeper-server-start.bat .\config\zookeeper.properties

cd C:\kafka\
.\bin\windows\kafka-server-start.bat .\config\server.properties
```

## Quality Gates

```bash
pnpm typecheck
pnpm build
pnpm --filter @ecommerce/api test
```
