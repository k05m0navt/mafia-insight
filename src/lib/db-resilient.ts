import { PrismaClient } from '@prisma/client';
import { prisma } from './db';

/**
 * Resilient database operations with automatic retry for connection issues
 *
 * Handles P1017 (connection closed) errors by retrying operations with exponential backoff
 */
export class ResilientDB {
  private maxRetries = 3;
  private baseDelay = 1000; // 1 second

  /**
   * Execute a database operation with automatic retry on connection errors
   */
  async execute<T>(
    operation: (db: PrismaClient) => Promise<T>,
    retryCount = 0
  ): Promise<T> {
    try {
      return await operation(prisma);
    } catch (error: unknown) {
      // Check if it's a connection error that we should retry
      if (this.shouldRetry(error) && retryCount < this.maxRetries) {
        const delay = this.baseDelay * Math.pow(2, retryCount);
        console.log(
          `[ResilientDB] Connection error, retrying in ${delay}ms (attempt ${retryCount + 1}/${this.maxRetries})`
        );

        await this.sleep(delay);
        return this.execute(operation, retryCount + 1);
      }

      // If it's not a retryable error or we've exhausted retries, throw
      throw error;
    }
  }

  /**
   * Check if an error should be retried
   */
  private shouldRetry(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;

    const errorObj = error as Record<string, unknown>;
    const errorMessage = String(errorObj.message || '');
    const errorCode = String(errorObj.code || '');

    // Retry on connection-related errors
    return (
      errorCode === 'P1017' || // Server closed the connection
      errorCode === 'P1001' || // Can't reach database server
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('closed')
    );
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const resilientDB = new ResilientDB();

/**
 * Helper function to execute database operations with retry logic
 */
export async function withRetry<T>(
  operation: (db: PrismaClient) => Promise<T>
): Promise<T> {
  return resilientDB.execute(operation);
}
