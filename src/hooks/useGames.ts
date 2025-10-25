'use client';

import { useState, useEffect, useCallback } from 'react';

interface Game {
  id: string;
  gomafiaId: string;
  date: string;
  durationMinutes: number;
  winnerTeam: string;
  status: string;
  lastSyncAt: string;
  syncStatus: 'SYNCED' | 'PENDING' | 'ERROR';
  tournamentId?: string;
  participations: Array<{
    player: {
      id: string;
      name: string;
      eloRating: number;
    };
    role: string;
    team: string;
    isWinner: boolean;
  }>;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface GamesResponse {
  games: Game[];
  pagination: Pagination;
}

interface UseGamesOptions {
  page?: number;
  limit?: number;
  status?: string;
  winnerTeam?: string;
  tournamentId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  autoFetch?: boolean;
}

interface UseGamesReturn {
  games: Game[];
  pagination: Pagination | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setStatus: (status: string) => void;
  setWinnerTeam: (winnerTeam: string) => void;
  setTournamentId: (tournamentId: string) => void;
  setStartDate: (startDate: string) => void;
  setEndDate: (endDate: string) => void;
  setSortBy: (sortBy: string) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
}

export function useGames(options: UseGamesOptions = {}): UseGamesReturn {
  const {
    page = 1,
    limit = 10,
    status = '',
    winnerTeam = '',
    tournamentId = '',
    startDate = '',
    endDate = '',
    sortBy = 'date',
    sortOrder = 'desc',
    autoFetch = true,
  } = options;

  const [games, setGames] = useState<Game[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
      });

      if (status) params.append('status', status);
      if (winnerTeam) params.append('winnerTeam', winnerTeam);
      if (tournamentId) params.append('tournamentId', tournamentId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/games?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch games');
      }

      const data: GamesResponse = await response.json();
      setGames(data.games);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [
    page,
    limit,
    status,
    winnerTeam,
    tournamentId,
    startDate,
    endDate,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    if (autoFetch) {
      fetchGames();
    }
  }, [fetchGames, autoFetch]);

  const setPage = useCallback((_newPage: number) => {
    // This would typically be handled by the parent component
    // that manages the page state
  }, []);

  const setLimit = useCallback((_newLimit: number) => {
    // This would typically be handled by the parent component
    // that manages the limit state
  }, []);

  const setStatus = useCallback((_newStatus: string) => {
    // This would typically be handled by the parent component
    // that manages the status state
  }, []);

  const setWinnerTeam = useCallback((_newWinnerTeam: string) => {
    // This would typically be handled by the parent component
    // that manages the winner team state
  }, []);

  const setTournamentId = useCallback((_newTournamentId: string) => {
    // This would typically be handled by the parent component
    // that manages the tournament ID state
  }, []);

  const setStartDate = useCallback((_newStartDate: string) => {
    // This would typically be handled by the parent component
    // that manages the start date state
  }, []);

  const setEndDate = useCallback((_newEndDate: string) => {
    // This would typically be handled by the parent component
    // that manages the end date state
  }, []);

  const setSortBy = useCallback((_newSortBy: string) => {
    // This would typically be handled by the parent component
    // that manages the sort by state
  }, []);

  const setSortOrder = useCallback((_newOrder: 'asc' | 'desc') => {
    // This would typically be handled by the parent component
    // that manages the sort order state
  }, []);

  return {
    games,
    pagination,
    loading,
    error,
    refetch: fetchGames,
    setPage,
    setLimit,
    setStatus,
    setWinnerTeam,
    setTournamentId,
    setStartDate,
    setEndDate,
    setSortBy,
    setSortOrder,
  };
}
