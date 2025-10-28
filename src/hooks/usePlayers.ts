'use client';

import { useState, useEffect, useCallback } from 'react';

interface Player {
  id: string;
  gomafiaId: string;
  name: string;
  eloRating: number;
  totalGames: number;
  wins: number;
  losses: number;
  lastSyncAt: string;
  syncStatus: 'SYNCED' | 'PENDING' | 'ERROR';
  clubId?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface PlayersResponse {
  players: Player[];
  pagination: Pagination;
}

interface UsePlayersOptions {
  page?: number;
  limit?: number;
  search?: string;
  syncStatus?: string;
  clubId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  autoFetch?: boolean;
}

interface UsePlayersReturn {
  players: Player[];
  pagination: Pagination | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSearch: (search: string) => void;
  setSyncStatus: (status: string) => void;
  setClubId: (clubId: string) => void;
  setSortBy: (sortBy: string) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
}

export function usePlayers(options: UsePlayersOptions = {}): UsePlayersReturn {
  const {
    page = 1,
    limit = 10,
    search = '',
    syncStatus = '',
    clubId = '',
    sortBy = 'lastSyncAt',
    sortOrder = 'desc',
    autoFetch = true,
  } = options;

  const [players, setPlayers] = useState<Player[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
      });

      if (search) params.append('search', search);
      if (syncStatus) params.append('syncStatus', syncStatus);
      if (clubId) params.append('clubId', clubId);

      const response = await fetch(`/api/players?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch players');
      }

      const data: PlayersResponse = await response.json();
      setPlayers(data.players);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, syncStatus, clubId, sortBy, sortOrder]);

  useEffect(() => {
    if (autoFetch) {
      fetchPlayers();
    }
  }, [fetchPlayers, autoFetch]);

  const setPage = useCallback(() => {
    // This would typically be handled by the parent component
    // that manages the page state
  }, []);

  const setLimit = useCallback(() => {
    // This would typically be handled by the parent component
    // that manages the limit state
  }, []);

  const setSearch = useCallback(() => {
    // This would typically be handled by the parent component
    // that manages the search state
  }, []);

  const setSyncStatus = useCallback(() => {
    // This would typically be handled by the parent component
    // that manages the sync status state
  }, []);

  const setClubId = useCallback(() => {
    // This would typically be handled by the parent component
    // that manages the club ID state
  }, []);

  const setSortBy = useCallback(() => {
    // This would typically be handled by the parent component
    // that manages the sort by state
  }, []);

  const setSortOrder = useCallback(() => {
    // This would typically be handled by the parent component
    // that manages the sort order state
  }, []);

  return {
    players,
    pagination,
    loading,
    error,
    refetch: fetchPlayers,
    setPage,
    setLimit,
    setSearch,
    setSyncStatus,
    setClubId,
    setSortBy,
    setSortOrder,
  };
}
