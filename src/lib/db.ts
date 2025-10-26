import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prisma Client Configuration with Optimized Connection Pooling
 *
 * Connection pool settings optimized for import operations with high-concurrency scraping:
 * - connection_limit: 20 connections (increased from default 10 for parallel scraping)
 * - pool_timeout: 10 seconds (increased from default 8s for long-running import operations)
 * - connect_timeout: 15 seconds (increased from default 10s for stability)
 *
 * Transaction timeout: 60 seconds for large batch operations during import
 *
 * Note: Adjust these values based on your PostgreSQL server configuration:
 * - PostgreSQL max_connections should be at least 2x connection_limit
 * - For production with multiple instances, reduce connection_limit per instance
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
      maxWait: 5000, // Maximum time to wait for a transaction slot (default: 2000ms)
      timeout: 60000, // Maximum transaction time: 60 seconds for batch operations (default: 5000ms)
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
