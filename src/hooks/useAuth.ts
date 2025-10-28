'use client';

import { useAuth as useAuthContext } from '@/components/auth/AuthProvider';

export function useAuth() {
  return useAuthContext();
}

// Re-export specific hooks for convenience
export {
  useAuthStatus,
  useCurrentUser,
  useUserRole,
  useIsAdmin,
} from '@/components/auth/AuthProvider';
