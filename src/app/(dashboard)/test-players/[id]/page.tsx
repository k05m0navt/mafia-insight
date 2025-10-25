'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface PlayerAnalytics {
  player: {
    id: string;
    name: string;
    eloRating: number;
    totalGames: number;
    wins: number;
    losses: number;
  };
  totalGames: number;
  winRate: number;
  averagePerformance: number;
  rolePerformance: Record<
    string,
    {
      gamesPlayed: number;
      winRate: number;
      averagePerformance: number;
    }
  >;
  recentGames: Array<{
    id: string;
    date: string;
    role: string;
    team: string;
    isWinner: boolean;
    performanceScore: number;
  }>;
  performanceTrend: Array<{
    date: string;
    performance: number;
  }>;
}

export default function TestPlayerAnalyticsPage() {
  const params = useParams();
  const playerId = params.id as string;

  const [analytics, setAnalytics] = useState<PlayerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('all');

  useEffect(() => {
    fetchAnalytics();
  }, [playerId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/test-players/${playerId}/analytics`);
      if (!response.ok) {
        if (response.status === 404) {
          setAnalytics(null);
          return;
        }
        throw new Error('Failed to fetch player analytics');
      }

      const data: PlayerAnalytics = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
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
          <button
            onClick={() => (window.location.href = '/test-players')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Players
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-600 mb-4">
            Player not found
          </h2>
          <button
            onClick={() => (window.location.href = '/test-players')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Players
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">{analytics.player.name}</h1>
            <p className="text-gray-600">ELO: {analytics.player.eloRating}</p>
          </div>
          <button
            onClick={() => (window.location.href = '/test-players')}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Back to Players
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-2">Total Games</h3>
            <p className="text-3xl font-bold text-blue-600">
              {analytics.totalGames}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-2">Win Rate</h3>
            <p className="text-3xl font-bold text-green-600">
              {(analytics.winRate * 100).toFixed(1)}%
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-2">Avg Performance</h3>
            <p className="text-3xl font-bold text-purple-600">
              {analytics.averagePerformance.toFixed(1)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="flex gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role Filter
              </label>
              <div className="flex gap-2">
                {['DON', 'MAFIA', 'SHERIFF', 'CITIZEN'].map((role) => (
                  <button
                    key={role}
                    onClick={() =>
                      setSelectedRole(selectedRole === role ? null : role)
                    }
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Range
              </label>
              <div className="flex gap-2">
                {['All Time', 'Last Week', 'Last Month'].map((range) => (
                  <button
                    key={range}
                    onClick={() =>
                      setTimeRange(range.toLowerCase().replace(' ', '-'))
                    }
                    className={`px-4 py-2 rounded-lg border ${
                      timeRange === range.toLowerCase().replace(' ', '-')
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Role Performance */}
        <div
          className="bg-white rounded-lg shadow-md p-6 mb-8"
          data-testid="role-stats"
        >
          <h3 className="text-xl font-semibold mb-4">Role Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(analytics.rolePerformance).map(([role, stats]) => (
              <div key={role} className="border rounded-lg p-4">
                <h4 className="font-semibold text-lg mb-2">{role}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Games:</span>
                    <span className="font-semibold">{stats.gamesPlayed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Win Rate:</span>
                    <span className="font-semibold">
                      {(stats.winRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Perf:</span>
                    <span className="font-semibold">
                      {stats.averagePerformance.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Chart */}
        <div
          className="bg-white rounded-lg shadow-md p-6 mb-8"
          data-testid="performance-chart"
        >
          <h3 className="text-xl font-semibold mb-4">Performance Trend</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <p>Performance chart would be rendered here</p>
          </div>
        </div>

        {/* Recent Games */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Recent Games</h3>
          <div className="space-y-4">
            {analytics.recentGames.map((game) => (
              <div
                key={game.id}
                className="flex justify-between items-center p-4 border rounded-lg"
              >
                <div>
                  <p className="font-semibold">
                    {game.role} - {game.team}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(game.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold ${game.isWinner ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {game.isWinner ? 'Win' : 'Loss'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Score: {game.performanceScore}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
