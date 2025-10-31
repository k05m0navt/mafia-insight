/**
 * GoMafia Sync Service
 * Provides high-level sync operations for external cron jobs and API routes
 */

import { runSync } from '@/lib/jobs/syncJob';

export interface SyncResult {
  success: boolean;
  recordsProcessed?: number;
  error?: string;
  errors?: string[];
}

/**
 * Run incremental sync (daily automated sync)
 * Fetches only updated data since last sync
 */
export async function runIncrementalSync(): Promise<SyncResult> {
  try {
    const result = await runSync({ type: 'INCREMENTAL' });

    return {
      success: result.success,
      recordsProcessed: result.recordsProcessed || 0,
      errors: result.errors || [],
    };
  } catch (error) {
    console.error('[SyncService] Incremental sync failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown sync error',
      errors: [error instanceof Error ? error.message : 'Unknown sync error'],
      recordsProcessed: 0,
    };
  }
}

/**
 * Run full sync (manual or initial sync)
 * Fetches all data from gomafia.pro
 */
export async function runFullSync(): Promise<SyncResult> {
  try {
    const result = await runSync({ type: 'FULL' });

    return {
      success: result.success,
      recordsProcessed: result.recordsProcessed || 0,
      errors: result.errors || [],
    };
  } catch (error) {
    console.error('[SyncService] Full sync failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown sync error',
      errors: [error instanceof Error ? error.message : 'Unknown sync error'],
      recordsProcessed: 0,
    };
  }
}
