import { SkeletonCard, SkeletonTable } from '@/components/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type LoadingLayout = 'cards' | 'table' | 'fullscreen' | 'minimal';

interface PageLoadingProps {
  title?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  cardCount?: number;
  tableRows?: number;
  layout?: LoadingLayout;
  showRetry?: boolean;
  onRetry?: () => void;
  className?: string;
}

export function PageLoading({
  title = 'Loading...',
  showSearch = true,
  showFilters = true,
  cardCount = 6,
  tableRows = 5,
  layout = 'cards',
  showRetry = false,
  onRetry,
  className = '',
}: PageLoadingProps) {
  if (layout === 'fullscreen') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">{title}</p>
          {showRetry && onRetry && (
            <Button onClick={onRetry} variant="outline" className="mt-4">
              Try Again
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (layout === 'minimal') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">{title}</p>
          {showRetry && onRetry && (
            <Button onClick={onRetry} variant="outline" className="mt-4">
              Try Again
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`container mx-auto p-6 ${className}`}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">{title}</h1>
        {(showSearch || showFilters) && (
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {showSearch && (
              <div className="flex-1">
                <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse"></div>
              </div>
            )}
            {showFilters && (
              <div className="flex gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-10 w-20 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse"
                  ></div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {layout === 'table' ? (
        <SkeletonTable rows={tableRows} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: cardCount }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {showRetry && onRetry && (
        <div className="flex justify-center mt-6">
          <Button onClick={onRetry} variant="outline">
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}

interface PageErrorProps {
  title?: string;
  message?: string;
  showRetry?: boolean;
  onRetry?: () => void;
}

export function PageError({
  title = 'Error',
  message = 'An error occurred while loading the page.',
  showRetry = true,
  onRetry,
}: PageErrorProps) {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">{title}</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            {showRetry && onRetry && (
              <Button onClick={onRetry} variant="outline">
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
