import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthState } from '@/types/auth';
import { authService } from '@/lib/auth';
import { permissionService } from '@/lib/permissions';

interface AuthStore extends AuthState {
  // Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    confirmPassword: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  updateUser: (user: User) => void;
  updatePermissions: (permissions: string[]) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // Initial state
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,

      // Actions
      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await authService.login({ email, password });
          const permissions = await authService.getPermissions();

          // Set permissions in permission service
          permissionService.setPermissions(permissions);

          set({
            isAuthenticated: true,
            user: response.user,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed',
          });
          throw error;
        }
      },

      signup: async (
        email: string,
        password: string,
        confirmPassword: string
      ) => {
        try {
          set({ isLoading: true, error: null });

          const response = await authService.signup({
            email,
            password,
            confirmPassword,
          });
          const permissions = await authService.getPermissions();

          // Set permissions in permission service
          permissionService.setPermissions(permissions);

          set({
            isAuthenticated: true,
            user: response.user,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Signup failed',
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true });

          await authService.logout();
          permissionService.setPermissions([]);

          set({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          console.error('Logout failed:', error);
          // Still clear state even if API call fails
          set({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: null,
          });
        }
      },

      checkAuthStatus: async () => {
        if (!authService.isAuthenticated()) {
          set({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: null,
          });
          return;
        }

        try {
          set({ isLoading: true });

          const user = await authService.getCurrentUser();
          const permissions = await authService.getPermissions();

          // Set permissions in permission service
          permissionService.setPermissions(permissions);

          set({
            isAuthenticated: true,
            user,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          console.error('Auth check failed:', error);
          set({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: null,
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      updateUser: (user: User) => {
        set({ user });
      },

      updatePermissions: (permissions: string[]) => {
        permissionService.setPermissions(permissions);
        // Note: We don't update the store state here as permissions are managed by the service
        // The store only tracks the user object, not individual permissions
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        // Don't persist loading state or errors
      }),
    }
  )
);

// Selectors
export const useAuthState = () =>
  useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    isLoading: state.isLoading,
    error: state.error,
  }));

export const useCurrentUser = () => useAuthStore((state) => state.user);

export const useIsAuthenticated = () =>
  useAuthStore((state) => state.isAuthenticated);

export const useIsLoading = () => useAuthStore((state) => state.isLoading);

export const useAuthError = () => useAuthStore((state) => state.error);

export const useUserRole = () =>
  useAuthStore((state) => state.user?.role || null);

export const useIsAdmin = () =>
  useAuthStore((state) => state.user?.role === 'admin');

// Action hooks
export const useAuthActions = () =>
  useAuthStore((state) => ({
    login: state.login,
    signup: state.signup,
    logout: state.logout,
    checkAuthStatus: state.checkAuthStatus,
    clearError: state.clearError,
    setLoading: state.setLoading,
    updateUser: state.updateUser,
    updatePermissions: state.updatePermissions,
  }));
