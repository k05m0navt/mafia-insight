import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthState } from '@/types/auth';
import { authService } from '@/lib/auth';
import { permissionService } from '@/lib/permissions';
import { getAuthTokenCookie, hasAuthTokenCookie } from '@/lib/utils/auth';

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

          // Verify cookie was set (cookie is set by API response)
          // Wait a brief moment for cookie to be set, then verify
          await new Promise((resolve) => setTimeout(resolve, 100));
          const hasCookie = hasAuthTokenCookie();

          if (!hasCookie) {
            console.warn(
              '[AuthStore] Cookie not set after login, but proceeding with store update'
            );
          }

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

          // Verify cookie was cleared
          // Wait a brief moment for cookie to be cleared, then verify
          await new Promise((resolve) => setTimeout(resolve, 100));
          const hasCookie = hasAuthTokenCookie();

          if (hasCookie) {
            console.warn(
              '[AuthStore] Cookie still present after logout, but clearing store state'
            );
          }

          set({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          console.error('Logout failed:', error);
          // Still clear state even if API call fails
          // Also clear cookie manually if API failed
          if (typeof document !== 'undefined') {
            document.cookie =
              'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            document.cookie =
              'user-role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          }
          set({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: null,
          });
        }
      },

      checkAuthStatus: async () => {
        try {
          set({ isLoading: true, error: null });

          // First check cookie - cookie is source of truth for SSR/API
          const hasCookie = hasAuthTokenCookie();
          const cookieToken = getAuthTokenCookie();

          // If no cookie, clear state immediately
          if (!hasCookie || !cookieToken) {
            set({
              isAuthenticated: false,
              user: null,
              isLoading: false,
              error: null,
            });
            return;
          }

          // Cookie exists - validate with API and sync state
          try {
            const user = await authService.getCurrentUser();

            // Get permissions (optional - don't fail if this fails)
            let permissions: string[] = [];
            try {
              permissions = await authService.getPermissions();
            } catch (permError) {
              // Permissions fetch failed - not critical, continue
              console.warn('Failed to fetch permissions:', permError);
            }

            // Set permissions in permission service
            permissionService.setPermissions(permissions);

            set({
              isAuthenticated: true,
              user,
              isLoading: false,
              error: null,
            });
          } catch (apiError) {
            // API validation failed - could be session expired
            const errorMessage =
              apiError instanceof Error ? apiError.message : 'Unknown error';

            // Check if it's a session expiry error (401 or specific error codes)
            const isSessionExpired =
              errorMessage.includes('expired') ||
              errorMessage.includes('401') ||
              errorMessage.includes('Unauthorized');

            if (isSessionExpired) {
              // Try to refresh the session
              try {
                const refreshResult = await authService.refreshToken();
                if (refreshResult.success) {
                  // Retry getting user after refresh
                  const refreshedUser = await authService.getCurrentUser();
                  const permissions = await authService
                    .getPermissions()
                    .catch(() => []);
                  permissionService.setPermissions(permissions);

                  set({
                    isAuthenticated: true,
                    user: refreshedUser,
                    isLoading: false,
                    error: null,
                  });
                  return;
                }
              } catch (_refreshError) {
                // Refresh failed - session truly expired
                console.warn('Session refresh failed, clearing auth state');
              }
            }

            // Session expired or auth failed - clear state
            console.warn(
              'Auth check failed (user not authenticated):',
              errorMessage
            );
            set({
              isAuthenticated: false,
              user: null,
              isLoading: false,
              error: isSessionExpired
                ? 'Session expired. Please sign in again.'
                : null,
            });
          }
        } catch (error) {
          console.error('Auth check error:', error);
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
