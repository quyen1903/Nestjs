import { config } from 'dotenv';
import { defineConfig, env } from "prisma/config";
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(appRoot, '..', '..');

config({ path: resolve(workspaceRoot, '.env'), quiet: true });
config({ path: resolve(appRoot, '.env'), override: true, quiet: true });
config({ path: resolve(workspaceRoot, `.env.${process.env.NODE_ENV || 'development'}`), override: true, quiet: true });
config({ path: resolve(appRoot, `.env.${process.env.NODE_ENV || 'development'}`), override: true, quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts", 
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
