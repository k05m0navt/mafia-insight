import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Build optimized connection URL with Supavisor pooler settings for IPv4 compatibility
 *
 * For connections from regions without IPv6 support (e.g., Russia):
 * - Uses Supavisor pooler (supports both IPv4 and IPv6)
 * - Adds pgbouncer=true for transaction mode compatibility
 * - Increases timeouts for better reliability
 * - Adds connection limit to prevent overwhelming the pooler
 */
function buildConnectionUrl(baseUrl: string | undefined): string {
  if (!baseUrl) {
    throw new Error('DATABASE_URL is not defined');
  }

  try {
    // Parse the URL to safely add/update query parameters
    const url = new URL(baseUrl);

    // Add/update connection pooler parameters for IPv4 compatibility
    // These settings work with Supavisor pooler (IPv4 compatible)
    url.searchParams.set('pgbouncer', 'true'); // Required for Supavisor transaction mode
    url.searchParams.set('connect_timeout', '30'); // Increased timeout for slow connections
    url.searchParams.set('pool_timeout', '60'); // Timeout for getting connection from pool
    url.searchParams.set('connection_limit', '5'); // Limit concurrent connections

    // Check if it's a pooler URL (contains .pooler.supabase.com)
    const isPoolerUrl = url.hostname.includes('.pooler.supabase.com');

    if (!isPoolerUrl) {
      // If it's a direct connection, warn the user
      // Direct connections use IPv6 by default and may not work from Russia
      // The FREE Supavisor pooler supports IPv4 and IPv6, so no paid add-on is needed!
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          '[DB] Warning: DATABASE_URL appears to use direct connection (IPv6 only). ' +
            'For FREE IPv4 compatibility (e.g., from Russia), use Supavisor pooler URL: ' +
            'postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true'
        );
      }
    }

    return url.toString();
  } catch (error) {
    // If URL parsing fails, log error and return original URL
    console.error('[DB] Failed to parse DATABASE_URL, using original:', error);
    return baseUrl;
  }
}

/**
 * Prisma Client Configuration with Supabase Connection Pooling
 *
 * Supabase connection pool settings optimized for import operations and IPv4 compatibility:
 * - pgbouncer=true: Use Supabase's connection pooler (required for transaction mode)
 * - connection_limit: 5 connections (max recommended for Supabase pooler)
 * - pool_timeout: 60 seconds (timeout for getting connection from pool)
 * - connect_timeout: 30 seconds (timeout for establishing new connection, increased for slow connections)
 * - sslmode=require: Required for Supabase connections
 *
 * Transaction timeout: 60 seconds for large batch operations during import
 *
 * Note: Supabase pooler handles connection management, so we use lower limits
 * to avoid overwhelming the pooler with too many concurrent connections.
 *
 * IPv4 Compatibility: The pooler supports both IPv4 and IPv6, making it ideal for
 * connections from regions where IPv6 may not be available (e.g., Russia).
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: buildConnectionUrl(process.env.DATABASE_URL),
      },
    },
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    // Configure transaction timeouts for large import batches
    transactionOptions: {
      maxWait: 15000, // Increased to 15 seconds for Supabase pooler and slow connections
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
