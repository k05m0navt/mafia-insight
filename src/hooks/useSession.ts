import { useState, useEffect, useCallback } from 'react';
import { authService, User } from '@/services/AuthService';

export interface Session {
  user: User | null;
  token: string | null;
  expiresAt: Date | null;
  isValid: boolean;
}

const scheduleMicrotask = (callback: () => void) => {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(callback);
  } else {
    Promise.resolve().then(callback);
  }
};

export function useSession(): Session & {
  refreshSession: () => { success: boolean; error?: string };
  isExpired: () => boolean;
  needsRefresh: () => boolean;
} {
  const [session, setSession] = useState<Session>(() => {
    const authSession = authService.getSession();
    const validation = authService.validateSession();

    return {
      user: authSession.user,
      token: authSession.token,
      expiresAt: authSession.expiresAt,
      isValid: validation.valid,
    };
  });

  // Update session state
  const updateSession = useCallback(() => {
    const authSession = authService.getSession();
    const validation = authService.validateSession();

    setSession({
      user: authSession.user,
      token: authSession.token,
      expiresAt: authSession.expiresAt,
      isValid: validation.valid,
    });
  }, []);

  // Initialize session
  useEffect(() => {
    const interval = setInterval(updateSession, 1000);
    return () => clearInterval(interval);
  }, [updateSession]);

  // Refresh session
  const refreshSession = useCallback(() => {
    const refreshResult = authService.refreshToken();

    if (refreshResult.success) {
      updateSession();
    }

    return refreshResult;
  }, [updateSession]);

  // Check if session is expired
  const isExpired = useCallback((): boolean => {
    if (!session.expiresAt) return true;
    return new Date() > session.expiresAt;
  }, [session.expiresAt]);

  // Check if session needs refresh (within 1 hour of expiry)
  const needsRefresh = useCallback((): boolean => {
    if (!session.expiresAt) return false;
    const oneHour = 60 * 60 * 1000;
    return new Date().getTime() + oneHour > session.expiresAt.getTime();
  }, [session.expiresAt]);

  // Auto-refresh session if needed
  useEffect(() => {
    if (session.isValid && needsRefresh()) {
      scheduleMicrotask(() => {
        refreshSession();
      });
    }
  }, [session.isValid, needsRefresh, refreshSession]);

  return {
    ...session,
    refreshSession,
    isExpired,
    needsRefresh,
  };
}

export default useSession;
