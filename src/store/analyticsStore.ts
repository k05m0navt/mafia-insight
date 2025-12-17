import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { DateRange, PlayerRole } from '@/types/analytics';

interface AnalyticsState {
  selectedRole: string | null;
  selectedRoles: PlayerRole[];
  timeRange: string;
  dateRange: DateRange | null;
  selectedPlayer: string | null;
  selectedClub: string | null;
  selectedTournament: string | null;
  setSelectedRole: (role: string | null) => void;
  setSelectedRoles: (roles: PlayerRole[]) => void;
  setTimeRange: (range: string) => void;
  setDateRange: (range: DateRange | null) => void;
  setSelectedPlayer: (playerId: string | null) => void;
  setSelectedClub: (clubId: string | null) => void;
  setSelectedTournament: (tournamentId: string | null) => void;
  reset: () => void;
}

const initialState = {
  selectedRole: null,
  selectedRoles: [],
  timeRange: 'all_time',
  dateRange: null,
  selectedPlayer: null,
  selectedClub: null,
  selectedTournament: null,
};

export const useAnalyticsStore = create<AnalyticsState>()(
  devtools(
    (set) => ({
      ...initialState,
      setSelectedRole: (role) => set({ selectedRole: role }),
      setSelectedRoles: (roles) => set({ selectedRoles: roles }),
      setTimeRange: (range) => set({ timeRange: range }),
      setDateRange: (range) => set({ dateRange: range }),
      setSelectedPlayer: (playerId) => set({ selectedPlayer: playerId }),
      setSelectedClub: (clubId) => set({ selectedClub: clubId }),
      setSelectedTournament: (tournamentId) =>
        set({ selectedTournament: tournamentId }),
      reset: () => set(initialState),
    }),
    { name: 'analytics-store' }
  )
);
