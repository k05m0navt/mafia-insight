/**
 * Early test environment setup.
 *
 * This file is loaded before any other setup files so we can safely configure
 * environment variables that would normally come from `.env` in local
 * development. CI runs may not provide a DATABASE_URL, which causes the Prisma
 * client initialization in `@/lib/db` to throw. We provide a safe placeholder
 * value and set a flag so the rest of the test harness can decide whether to
 * perform real database work.
 */

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

if (!hasDatabaseUrl) {
  // Provide a deterministic but obviously fake connection string so Prisma's
  // connection URL builder does not throw during module evaluation.
  const placeholderUrl =
    'postgresql://placeholder:placeholder@localhost:5432/mafia_insight_test';

  process.env.DATABASE_URL = placeholderUrl;

  // Ensure `directUrl` references a valid value to avoid runtime warnings in
  // environments that expect it.
  if (!process.env.DIRECT_URL) {
    process.env.DIRECT_URL = placeholderUrl;
  }

  // Downstream setup can read this flag to decide whether to skip expensive
  // database work and use lightweight mocks instead.
  process.env.PRISMA_SKIP_DB = 'true';
}
