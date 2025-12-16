/**
 * Progress calculation utilities for import progress tracking.
 * Handles edge cases like division by zero and provides accurate time estimates.
 */

/**
 * Calculate processing rate (entities per second).
 * @param processedCount Number of entities processed
 * @param elapsedSeconds Elapsed time in seconds
 * @returns Processing rate (entities per second), or 0 if elapsed time is 0
 */
export function calculateProcessingRate(
  processedCount: number,
  elapsedSeconds: number
): number {
  if (elapsedSeconds <= 0 || processedCount < 0) {
    return 0;
  }
  return processedCount / elapsedSeconds;
}

/**
 * Calculate estimated time remaining in seconds.
 * @param remainingCount Number of entities remaining to process
 * @param processingRate Processing rate (entities per second)
 * @returns Estimated time remaining in seconds, or 0 if rate is 0 or remaining is 0
 */
export function calculateEstimatedTimeRemaining(
  remainingCount: number,
  processingRate: number
): number {
  if (processingRate <= 0 || remainingCount <= 0) {
    return 0;
  }
  return remainingCount / processingRate;
}

/**
 * Calculate progress percentage (0-100).
 * @param processedCount Number of entities processed
 * @param totalCount Total number of entities
 * @returns Progress percentage (0-100), or 0 if total is 0
 */
export function calculateProgressPercentage(
  processedCount: number,
  totalCount: number
): number {
  if (totalCount <= 0 || processedCount < 0) {
    return 0;
  }
  if (processedCount >= totalCount) {
    return 100;
  }
  return Math.round((processedCount / totalCount) * 100);
}

/**
 * Format time in seconds to human-readable string.
 * @param seconds Time in seconds
 * @returns Formatted string (e.g., "2h 30m", "45m", "30s")
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) {
    return 'Less than a minute';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

/**
 * Format processing rate to human-readable string.
 * @param rate Processing rate (entities per second)
 * @returns Formatted string (e.g., "10.5/sec", "0.5/min")
 */
export function formatProcessingRate(rate: number): string {
  if (rate <= 0) {
    return '0/sec';
  }
  if (rate >= 1) {
    return `${rate.toFixed(1)}/sec`;
  }
  // If less than 1 per second, show per minute
  return `${(rate * 60).toFixed(1)}/min`;
}
