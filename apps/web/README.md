# Ecommerce Web

Next.js App Router frontend for the ecommerce SaaS backend.

## Run

```bash
pnpm --filter @ecommerce/web dev
```

The app reads `NEXT_PUBLIC_API_BASE_URL` when real backend calls are enabled.
If the API is unavailable or a route is not wired yet, feature clients return
synthetic demo data from `api/mock-data.ts`.

## API Boundary

UI components do not import mock data directly. Data flows through typed clients
in `api/`, then through TanStack Query hooks in `features/*/api`.

Dashboard requests carry an organization context through the API layer. The
frontend context is a routing and UX guard only; backend authorization remains
the source of truth.
