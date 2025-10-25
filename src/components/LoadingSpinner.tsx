import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

export function LoadingSpinner({
  size = 'md',
  className,
  text,
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2',
        className
      )}
    >
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-primary border-t-transparent',
          sizeClasses[size]
        )}
      />
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
      )}
    </div>
  );
}

export function LoadingPage({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

export function LoadingCard({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center p-8">
      <LoadingSpinner size="md" text={text} />
    </div>
  );
}

// Skeleton loaders for better UX
export function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="bg-slate-200 dark:bg-slate-700 rounded-lg p-6">
        <div className="space-y-4">
          <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-3/4"></div>
          <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-1/2"></div>
          <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-5/6"></div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex space-x-4">
            <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-1/4"></div>
            <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-1/4"></div>
            <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-1/4"></div>
            <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
