import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ManualSyncButton } from '@/components/sync/ManualSyncButton';
import { useManualSync } from '@/hooks/useManualSync';

// Mock the hook
vi.mock('@/hooks/useManualSync');
vi.mock('@/components/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Loader2: ({ className }: { className?: string }) => (
    <div data-testid="loader-icon" className={className} />
  ),
  RefreshCw: ({ className }: { className?: string }) => (
    <div data-testid="refresh-icon" className={className} />
  ),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('ManualSyncButton', () => {
  const mockTriggerSync = vi.fn();
  const mockUseManualSync = vi.mocked(useManualSync);

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseManualSync.mockReturnValue({
      triggerSync: mockTriggerSync,
      triggerSyncAsync: vi.fn(),
      isPending: false,
      isSuccess: false,
      isError: false,
      syncError: null,
      syncData: undefined,
      syncStatus: {
        isRunning: false,
        progress: 0,
        currentOperation: null,
        lastSyncTime: null,
        lastSyncType: null,
        lastError: null,
        syncLogId: null,
        syncLogStatus: null,
        startTime: null,
        endTime: null,
      },
      isLoadingStatus: false,
      statusError: null,
      isRunning: false,
      progress: 0,
      currentOperation: null,
      lastError: null,
    });
  });

  it('should render sync button with default text', () => {
    render(<ManualSyncButton />, { wrapper: createWrapper() });

    expect(
      screen.getByRole('button', { name: /sync now/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
  });

  it('should call triggerSync when button is clicked', async () => {
    const user = userEvent.setup();
    render(<ManualSyncButton />, { wrapper: createWrapper() });

    const button = screen.getByRole('button', { name: /sync now/i });
    await user.click(button);

    expect(mockTriggerSync).toHaveBeenCalledTimes(1);
  });

  it('should disable button and show loading state when sync is pending', () => {
    mockUseManualSync.mockReturnValue({
      ...mockUseManualSync(),
      isPending: true,
    } as any);

    render(<ManualSyncButton />, { wrapper: createWrapper() });

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Syncing...');
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
  });

  it('should disable button when sync is running', () => {
    mockUseManualSync.mockReturnValue({
      ...mockUseManualSync(),
      isRunning: true,
      progress: 50,
      currentOperation: 'Processing games...',
    } as any);

    render(<ManualSyncButton showProgress={true} />, {
      wrapper: createWrapper(),
    });

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should show progress bar when sync is running and showProgress is true', () => {
    mockUseManualSync.mockReturnValue({
      ...mockUseManualSync(),
      isRunning: true,
      progress: 50,
      currentOperation: 'Processing games...',
    } as any);

    render(<ManualSyncButton showProgress={true} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('Processing games...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should not show progress bar when showProgress is false', () => {
    mockUseManualSync.mockReturnValue({
      ...mockUseManualSync(),
      isRunning: true,
      progress: 50,
      currentOperation: 'Processing games...',
    } as any);

    render(<ManualSyncButton showProgress={false} />, {
      wrapper: createWrapper(),
    });

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('should display error message when lastError is present and sync is not running', () => {
    mockUseManualSync.mockReturnValue({
      ...mockUseManualSync(),
      lastError: 'Sync failed: Network error',
      isRunning: false,
    } as any);

    render(<ManualSyncButton showProgress={true} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Sync failed: Network error')).toBeInTheDocument();
  });

  it('should have correct aria attributes', () => {
    mockUseManualSync.mockReturnValue({
      ...mockUseManualSync(),
      isRunning: true,
    } as any);

    render(<ManualSyncButton />, { wrapper: createWrapper() });

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Sync in progress');
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('should use custom variant and size props', () => {
    render(<ManualSyncButton variant="outline" size="sm" />, {
      wrapper: createWrapper(),
    });

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });
});
