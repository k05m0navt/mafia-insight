'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useSkippedEntities,
  useSkippedEntitiesSummary,
} from '@/hooks/useImportControls';
import { RetryDialog } from './RetryDialog';
import { RefreshCw, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface SkippedEntitiesTableProps {
  className?: string;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'PENDING':
      return (
        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    case 'RETRYING':
      return (
        <Badge variant="default" className="flex items-center gap-1 w-fit">
          <RefreshCw className="h-3 w-3 animate-spin" />
          Retrying
        </Badge>
      );
    case 'COMPLETED':
      return (
        <Badge
          variant="default"
          className="flex items-center gap-1 w-fit bg-green-100 text-green-800"
        >
          <CheckCircle2 className="h-3 w-3" />
          Completed
        </Badge>
      );
    case 'FAILED':
      return (
        <Badge variant="destructive" className="flex items-center gap-1 w-fit">
          <AlertCircle className="h-3 w-3" />
          Failed
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export function SkippedEntitiesTable({ className }: SkippedEntitiesTableProps) {
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [retryDialogOpen, setRetryDialogOpen] = useState(false);
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);

  const { data: summary, isLoading: summaryLoading } =
    useSkippedEntitiesSummary();
  const { data: entities, isLoading: entitiesLoading } = useSkippedEntities(
    selectedPhase !== 'all' ? selectedPhase : undefined,
    'PENDING'
  );

  const handleRetrySelected = (entityIds: string[]) => {
    setSelectedEntities(entityIds);
    setRetryDialogOpen(true);
  };

  const phases = summary
    ? Object.keys(summary).filter(
        (phase) => summary[phase] && summary[phase].pending > 0
      )
    : [];

  const totalPending = summary
    ? Object.values(summary).reduce((sum, phase) => sum + phase.pending, 0)
    : 0;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Skipped Entities
            </CardTitle>
            <CardDescription>
              Entities that failed during import and can be retried manually
            </CardDescription>
          </div>
          {totalPending > 0 && (
            <Badge variant="secondary" className="text-lg">
              {totalPending} Pending
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {summaryLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : totalPending === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
            <p>No skipped entities to retry</p>
          </div>
        ) : (
          <Tabs value={selectedPhase} onValueChange={setSelectedPhase}>
            <TabsList
              className="grid w-full"
              style={{
                gridTemplateColumns: `repeat(${Math.min(phases.length + 1, 6)}, minmax(0, 1fr))`,
              }}
            >
              <TabsTrigger value="all">All</TabsTrigger>
              {phases.slice(0, 5).map((phase) => (
                <TabsTrigger key={phase} value={phase}>
                  {phase.replace(/_/g, ' ')}
                  {summary && summary[phase] && (
                    <Badge variant="secondary" className="ml-2">
                      {summary[phase].pending}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {phases.map((phase) => (
              <TabsContent key={phase} value={phase} className="mt-4">
                <SkippedEntitiesPhaseTable
                  entities={
                    selectedPhase === phase
                      ? entities?.filter((e) => e.phase === phase) || []
                      : []
                  }
                  isLoading={entitiesLoading}
                  onRetry={handleRetrySelected}
                />
              </TabsContent>
            ))}

            <TabsContent value="all" className="mt-4">
              <SkippedEntitiesPhaseTable
                entities={entities || []}
                isLoading={entitiesLoading}
                onRetry={handleRetrySelected}
              />
            </TabsContent>
          </Tabs>
        )}

        <RetryDialog
          open={retryDialogOpen}
          onOpenChange={setRetryDialogOpen}
          entityIds={selectedEntities}
          onSuccess={() => {
            setRetryDialogOpen(false);
            setSelectedEntities([]);
          }}
        />
      </CardContent>
    </Card>
  );
}

interface SkippedEntitiesPhaseTableProps {
  entities: Array<{
    id: string;
    phase: string;
    entityType: string;
    entityId: string | null;
    pageNumber: number | null;
    errorCode: string;
    errorMessage: string;
    retryCount: number;
    status: string;
    createdAt: string;
  }>;
  isLoading: boolean;
  onRetry: (entityIds: string[]) => void;
}

function SkippedEntitiesPhaseTable({
  entities,
  isLoading,
  onRetry,
}: SkippedEntitiesPhaseTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (entities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No skipped entities for this phase
      </div>
    );
  }

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleRetrySelected = () => {
    if (selectedIds.size > 0) {
      onRetry(Array.from(selectedIds));
    }
  };

  return (
    <div className="space-y-4">
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedIds.size} entity(ies) selected
          </span>
          <Button
            size="sm"
            onClick={handleRetrySelected}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry Selected
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={
                    selectedIds.size === entities.length && entities.length > 0
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(new Set(entities.map((e) => e.id)));
                    } else {
                      setSelectedIds(new Set());
                    }
                  }}
                  className="rounded"
                />
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Entity ID</TableHead>
              <TableHead>Page</TableHead>
              <TableHead>Error</TableHead>
              <TableHead>Retries</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entities.map((entity) => (
              <TableRow key={entity.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(entity.id)}
                    onChange={() => toggleSelection(entity.id)}
                    className="rounded"
                  />
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{entity.entityType}</Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {entity.entityId || '-'}
                </TableCell>
                <TableCell>
                  {entity.pageNumber !== null
                    ? `Page ${entity.pageNumber}`
                    : '-'}
                </TableCell>
                <TableCell>
                  <div className="max-w-xs">
                    <p className="text-xs font-medium text-destructive">
                      {entity.errorCode}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {entity.errorMessage}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{entity.retryCount}</Badge>
                </TableCell>
                <TableCell>{getStatusBadge(entity.status)}</TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRetry([entity.id])}
                    className="flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Retry
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
