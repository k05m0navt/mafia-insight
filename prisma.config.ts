import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Use process.env directly for optional DATABASE_URL (needed for prisma generate in CI)
    // Provide a dummy URL if not set - this is only used for schema validation, not actual connection
    url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/db?schema=public',
    ...(process.env.DIRECT_URL && { directUrl: env('DIRECT_URL') }),
    ...(process.env.SHADOW_DATABASE_URL && { shadowDatabaseUrl: env('SHADOW_DATABASE_URL') }),
  },
});
