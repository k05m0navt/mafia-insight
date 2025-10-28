'use client';

import { useState, useEffect, useCallback } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import type { Session } from '@supabase/supabase-js';

interface SessionState {
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export const useSession = () => {
  const [state, setState] = useState<SessionState>({
    session: null,
    loading: true,
    error: null,
  });

  const supabase = createSupabaseClient();

  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        throw error;
      }

      setState((prev) => ({
        ...prev,
        session: data.session,
        loading: false,
        error: null,
      }));

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Session refresh failed';
      setState((prev) => ({
        ...prev,
        session: null,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, [supabase.auth]);

  const isSessionValid = useCallback(() => {
    if (!state.session) return false;

    const now = new Date().getTime() / 1000;
    const expiresAt = state.session.expires_at;

    // Consider session valid if it expires in more than 5 minutes
    return expiresAt ? expiresAt > now + 300 : false;
  }, [state.session]);

  const getTimeUntilExpiry = useCallback(() => {
    if (!state.session) return 0;

    const now = new Date().getTime() / 1000;
    const expiresAt = state.session.expires_at;

    return expiresAt ? Math.max(0, expiresAt - now) : 0;
  }, [state.session]);

  // Initialize session state
  useEffect(() => {
    let mounted = true;

    const initializeSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
        }

        if (mounted) {
          setState({
            session,
            loading: false,
            error: null,
          });
        }
      } catch {
        if (mounted) {
          setState({
            session: null,
            loading: false,
            error: 'Failed to initialize session',
          });
        }
      }
    };

    initializeSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        setState({
          session,
          loading: false,
          error: null,
        });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  return {
    ...state,
    refreshSession,
    isSessionValid,
    getTimeUntilExpiry,
  };
};
