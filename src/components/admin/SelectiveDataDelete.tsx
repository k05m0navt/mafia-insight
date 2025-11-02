'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { toast } from '@/components/hooks/use-toast';

type DeletableDataType =
  | 'tournaments'
  | 'players'
  | 'clubs'
  | 'games'
  | 'player_statistics'
  | 'tournament_results'
  | 'all';

interface DataTypeOption {
  value: DeletableDataType;
  label: string;
  description: string;
}

const dataTypeOptions: DataTypeOption[] = [
  {
    value: 'tournaments',
    label: 'Tournaments',
    description: 'Delete all tournaments and related games',
  },
  {
    value: 'players',
    label: 'Players',
    description: 'Delete all players and their statistics',
  },
  {
    value: 'clubs',
    label: 'Clubs',
    description: 'Delete all clubs (players will be unlinked)',
  },
  {
    value: 'games',
    label: 'Games',
    description: 'Delete all games and participations',
  },
  {
    value: 'player_statistics',
    label: 'Player Statistics',
    description:
      'Delete all player statistics (year stats and role stats). Players will be kept.',
  },
  {
    value: 'tournament_results',
    label: 'Tournament Results',
    description:
      'Delete all player-tournament relationships (placements, points, prizes). Players and tournaments will be kept.',
  },
  {
    value: 'all',
    label: 'All Data',
    description: 'Delete all imported data (complete reset)',
  },
];

export function SelectiveDataDelete() {
  const { data, refetch } = useAdminDashboard();
  const [selectedDataType, setSelectedDataType] = useState<
    DeletableDataType | ''
  >('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const isImportRunning = data?.importStatus?.isRunning || false;

  const handleDelete = async () => {
    if (!selectedDataType) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a data type to delete',
      });
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/admin/import/clear-data-type', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataType: selectedDataType,
          confirm: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          variant: 'destructive',
          title: 'Error',
          description: `Failed to delete data: ${error.error || 'Unknown error'}`,
        });
        setIsDialogOpen(false);
        return;
      }

      const result = await response.json();

      // Refresh dashboard data
      refetch();
      setIsDialogOpen(false);
      setSelectedDataType('');

      // Show success message with details
      const deletedCounts = Object.entries(result.deleted || {})
        .filter(
          ([_, count]: [string, unknown]) =>
            typeof count === 'number' && count > 0
        )
        .map(([table, count]: [string, unknown]) => `${table}: ${count}`)
        .join(', ');

      toast({
        title: 'Success',
        description: `${dataTypeOptions.find((opt) => opt.value === selectedDataType)?.label} deleted successfully${deletedCounts ? ` (${deletedCounts})` : ''}`,
      });
    } catch (error) {
      console.error('Failed to delete data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete data. Please try again.',
      });
      setIsDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedOption = selectedDataType
    ? dataTypeOptions.find((opt) => opt.value === selectedDataType)
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delete Data</CardTitle>
        <CardDescription>
          Selectively delete specific types of imported data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Data Type</label>
          <Select
            value={selectedDataType}
            onValueChange={(value) =>
              setSelectedDataType(value as DeletableDataType)
            }
            disabled={isImportRunning || isDeleting}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select data type to delete" />
            </SelectTrigger>
            <SelectContent>
              {dataTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              className="w-full"
              disabled={!selectedDataType || isImportRunning || isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete {selectedOption?.label || 'Selected Data'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete {selectedOption?.label}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {selectedOption && (
                  <div className="space-y-2">
                    <p>{selectedOption.description}</p>
                    <p className="font-medium text-destructive">
                      This action cannot be undone. All related data will also
                      be deleted.
                    </p>
                    {selectedDataType === 'tournaments' && (
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        <li>All tournaments</li>
                        <li>All games (tournament games)</li>
                        <li>Player-tournament relationships</li>
                      </ul>
                    )}
                    {selectedDataType === 'players' && (
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        <li>All players</li>
                        <li>All game participations</li>
                        <li>All player statistics (year stats, role stats)</li>
                        <li>Player-tournament relationships</li>
                      </ul>
                    )}
                    {selectedDataType === 'clubs' && (
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        <li>All clubs</li>
                        <li>
                          Players will be unlinked from clubs (not deleted)
                        </li>
                      </ul>
                    )}
                    {selectedDataType === 'games' && (
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        <li>All games</li>
                        <li>All game participations</li>
                      </ul>
                    )}
                    {selectedDataType === 'player_statistics' && (
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        <li>All player year statistics</li>
                        <li>All player role statistics</li>
                        <li className="font-medium text-foreground">
                          Players will be preserved (not deleted)
                        </li>
                      </ul>
                    )}
                    {selectedDataType === 'tournament_results' && (
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        <li>All player-tournament relationships</li>
                        <li>All tournament placements</li>
                        <li>
                          All GG points, ELO changes, and prize money records
                        </li>
                        <li className="font-medium text-foreground">
                          Players and tournaments will be preserved (not
                          deleted)
                        </li>
                      </ul>
                    )}
                    {selectedDataType === 'all' && (
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        <li>All tournaments</li>
                        <li>All players</li>
                        <li>All clubs</li>
                        <li>All games</li>
                        <li>All statistics and relationships</li>
                        <li>
                          User accounts and system settings will be preserved
                        </li>
                      </ul>
                    )}
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {isImportRunning && (
          <p className="text-sm text-amber-600">
            ⚠️ Cannot delete data while import is running
          </p>
        )}
      </CardContent>
    </Card>
  );
}
