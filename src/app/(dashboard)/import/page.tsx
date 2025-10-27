'use client';

import { useImportStatus } from '@/hooks/useImportStatus';
import { useImportTrigger } from '@/hooks/useImportTrigger';
import { ImportProgressCard } from '@/components/sync/ImportProgressCard';
import { ImportControls } from '@/components/sync/ImportControls';
import { ImportSummary } from '@/components/sync/ImportSummary';
import { ValidationSummaryCard } from '@/components/sync/ValidationSummaryCard';
import { ErrorMessagePanel } from '@/components/sync/ErrorMessagePanel';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Force dynamic rendering since this page uses client-side data fetching
export const dynamic = 'force-dynamic';

/**
 * Map error codes to user-friendly guidance.
 * Based on error codes from specs/003-gomafia-data-import/spec.md
 */
function getErrorGuidance(errorCode?: string): string[] {
  switch (errorCode) {
    case 'EC-001':
      return [
        'gomafia.pro is currently unavailable',
        'Wait a few minutes and try again',
        'Check https://gomafia.pro/ status directly',
      ];
    case 'EC-006':
      return [
        'Check your internet connection',
        'Verify gomafia.pro is accessible',
        'Try again in a few minutes',
      ];
    case 'EC-008':
      return [
        'The import took longer than the 12-hour limit',
        'You can resume from where it stopped',
        'A checkpoint was saved automatically',
      ];
    case 'EC-004':
      return [
        'The data format from gomafia.pro may have changed',
        'Please report this issue',
        'Try again later or contact support',
      ];
    default:
      return [
        'Review the error details and try again',
        'Contact support if the issue persists',
      ];
  }
}

/**
 * Extract error code from error message if present.
 * Expected format: "EC-XXX: Error message" or just error message
 */
function extractErrorCode(error?: string | Error | null): string | undefined {
  if (!error) return undefined;
  const message = typeof error === 'string' ? error : error.message;
  const match = message.match(/^(EC-\d{3})/);
  return match ? match[1] : undefined;
}

export default function ImportPage() {
  const { data: status, isLoading, error } = useImportStatus();
  const {
    trigger,
    cancel,
    isPending,
    error: triggerError,
    data: triggerData,
  } = useImportTrigger();

  const handleTrigger = () => {
    trigger({});
  };

  const handleCancel = () => {
    cancel();
  };

  // Determine current error and error code
  const currentError = triggerError?.message || status?.lastError;
  const errorCode = extractErrorCode(currentError);
  const errorGuidance = getErrorGuidance(errorCode);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading import status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <ErrorMessagePanel
          error={error}
          title="Failed to Load Import Status"
          guidance="Refresh the page or check your connection"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Import Management</h1>
          <p className="text-muted-foreground">
            Import historical data from gomafia.pro
          </p>
        </div>
      </div>

      {/* Import Controls with Error Recovery */}
      <ImportControls
        isRunning={status?.isRunning || false}
        isPending={isPending}
        error={currentError}
        errorCode={errorCode}
        errorGuidance={errorGuidance}
        successMessage={triggerData?.message}
        onTrigger={handleTrigger}
        onCancel={handleCancel}
        isRetry={!!status?.lastError}
      />

      {/* Progress Display */}
      <ImportProgressCard
        isRunning={status?.isRunning || false}
        progress={status?.progress || 0}
        currentOperation={status?.currentOperation ?? null}
        lastSyncTime={status?.lastSyncTime ?? null}
      />

      {/* Summary */}
      {status?.summary && (
        <ImportSummary
          summary={status.summary}
          lastSyncTime={status.lastSyncTime}
        />
      )}

      {/* Validation Summary */}
      {status?.validation && (
        <ValidationSummaryCard
          validationRate={status.validation.validationRate}
          totalRecordsProcessed={status.validation.totalRecordsProcessed}
          validRecords={status.validation.validRecords}
          invalidRecords={status.validation.invalidRecords}
        />
      )}

      {/* Additional Info */}
      {status?.isRunning && (
        <Alert>
          <AlertDescription>
            Import is running in the background. You can safely navigate away
            from this page. The import will continue, and you can return here to
            check the progress.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
