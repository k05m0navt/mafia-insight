import { useState, useEffect, useCallback } from 'react';
import { authService, User } from '@/services/AuthService';

export interface Session {
  user: User | null;
  token: string | null;
  expiresAt: Date | null;
  isValid: boolean;
}

export function useSession(): Session & { refreshSession: () => { success: boolean; error?: string }; isExpired: () => boolean; needsRefresh: () => boolean } {
  const [session, setSession] = useState<Session>({
    user: null,
    token: null,
    expiresAt: null,
    isValid: false,
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
    updateSession();

    // Set up interval to check session validity
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
      refreshSession();
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