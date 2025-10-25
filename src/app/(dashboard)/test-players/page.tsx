'use client';

import { useState, useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface Player {
  id: string;
  gomafiaId: string;
  name: string;
  eloRating: number;
  totalGames: number;
  wins: number;
  losses: number;
  user: {
    id: string;
    name: string;
    email: string;
  };
  club?: {
    id: string;
    name: string;
    description?: string;
  };
  roleStats: Array<{
    id: string;
    role: string;
    gamesPlayed: number;
    wins: number;
    losses: number;
    winRate: number;
    averagePerformance: number;
  }>;
}

interface PlayersResponse {
  data: Player[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function TestPlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  useEffect(() => {
    fetchPlayers();
  }, [search, selectedRole]);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: '1',
        limit: '20',
        ...(search && { search }),
        ...(selectedRole && { role: selectedRole }),
      });

      const response = await fetch(`/api/test-players?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch players');
      }

      const data: PlayersResponse = await response.json();
      setPlayers(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPlayers();
  };

  const handleRoleFilter = (role: string) => {
    setSelectedRole(selectedRole === role ? null : role);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div
          className="flex justify-center items-center h-64"
          data-testid="loading-spinner"
        >
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Test Players</h1>

        {/* Search and Filters */}
        <div
          className="mb-8 flex flex-col md:flex-row gap-4"
          data-testid="search-container"
        >
          <form onSubmit={handleSearch} className="flex gap-4 mb-4">
            <input
              type="text"
              placeholder="Search players..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Search players"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
            >
              Search
            </button>
          </form>

          {/* Role Filters */}
          <div className="flex gap-2 flex-wrap">
            {['DON', 'MAFIA', 'SHERIFF', 'CITIZEN'].map((role) => (
              <button
                key={role}
                onClick={() => handleRoleFilter(role)}
                className={`px-4 py-2 rounded-lg border ${
                  selectedRole === role
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Players Grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          data-testid="players-grid"
        >
          {players.map((player) => (
            <div
              key={player.id}
              className="bg-white rounded-lg shadow-md p-6"
              data-testid="player-card"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{player.name}</h3>
                  <p className="text-gray-600">ELO: {player.eloRating}</p>
                </div>
                {player.club && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                    {player.club.name}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Total Games</p>
                  <p className="text-lg font-semibold">{player.totalGames}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Win Rate</p>
                  <p className="text-lg font-semibold">
                    {((player.wins / player.totalGames) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() =>
                    (window.location.href = `/test-players/${player.id}`)
                  }
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                >
                  View Analytics
                </button>
              </div>
            </div>
          ))}
        </div>

        {players.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No players found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
