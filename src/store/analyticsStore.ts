import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AnalyticsState {
  selectedRole: string | null;
  timeRange: string;
  selectedPlayer: string | null;
  selectedClub: string | null;
  selectedTournament: string | null;
  setSelectedRole: (role: string | null) => void;
  setTimeRange: (range: string) => void;
  setSelectedPlayer: (playerId: string | null) => void;
  setSelectedClub: (clubId: string | null) => void;
  setSelectedTournament: (tournamentId: string | null) => void;
}

export const useAnalyticsStore = create<AnalyticsState>()(
  devtools(
    (set) => ({
      selectedRole: null,
      timeRange: 'all_time',
      selectedPlayer: null,
      selectedClub: null,
      selectedTournament: null,
      setSelectedRole: (role) => set({ selectedRole: role }),
      setTimeRange: (range) => set({ timeRange: range }),
      setSelectedPlayer: (playerId) => set({ selectedPlayer: playerId }),
      setSelectedClub: (clubId) => set({ selectedClub: clubId }),
      setSelectedTournament: (tournamentId) =>
        set({ selectedTournament: tournamentId }),
    }),
    { name: 'analytics-store' }
  )
);
