import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prisma Client Configuration with Supabase Connection Pooling
 *
 * Supabase connection pool settings optimized for import operations:
 * - pgbouncer=true: Use Supabase's connection pooler
 * - connection_limit: 5 connections (max recommended for Supabase pooler)
 * - pool_timeout: 60 seconds (timeout for getting connection from pool)
 * - connect_timeout: 30 seconds (timeout for establishing new connection)
 * - sslmode=require: Required for Supabase connections
 *
 * Transaction timeout: 60 seconds for large batch operations during import
 *
 * Note: Supabase pooler handles connection management, so we use lower limits
 * to avoid overwhelming the pooler with too many concurrent connections.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    // Configure transaction timeouts for large import batches
    transactionOptions: {
      maxWait: 10000, // Increased to 10 seconds for Supabase pooler
      timeout: 60000, // Maximum transaction time: 60 seconds for batch operations
    },
  });

// Export as 'db' for compatibility
export const db = prisma;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Connection pool monitoring (for debugging)
 * Uncomment in development to monitor pool usage during imports
 */
// prisma.$on('query', (e) => {
//   console.log('Query: ' + e.query);
//   console.log('Duration: ' + e.duration + 'ms');
// });
