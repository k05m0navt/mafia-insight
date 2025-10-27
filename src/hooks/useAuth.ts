'use client';

import { useState, useEffect, useCallback } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type {
  AuthUser,
  LoginCredentials,
  SignupCredentials,
} from '@/lib/types/auth';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  const supabase = createSupabaseClient();

  const transformUser = useCallback((user: User | null): AuthUser | null => {
    if (!user) return null;

    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.name || user.email?.split('@')[0] || '',
      role: (user.user_metadata?.role as 'GUEST' | 'USER' | 'ADMIN') || 'USER',
      avatar: user.user_metadata?.avatar_url,
      isActive: true,
      lastLoginAt: user.last_sign_in_at
        ? new Date(user.last_sign_in_at)
        : undefined,
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at || user.created_at),
    };
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

        if (error) {
          throw error;
        }

        setState((prev) => ({
          ...prev,
          user: transformUser(data.user),
          loading: false,
          error: null,
        }));

        return { success: true };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Login failed';
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        return { success: false, error: errorMessage };
      }
    },
    [supabase.auth, transformUser]
  );

  const signup = useCallback(
    async (credentials: SignupCredentials) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const { data, error } = await supabase.auth.signUp({
          email: credentials.email,
          password: credentials.password,
          options: {
            data: {
              name: credentials.name,
              role: 'USER',
            },
          },
        });

        if (error) {
          throw error;
        }

        setState((prev) => ({
          ...prev,
          user: transformUser(data.user),
          loading: false,
          error: null,
        }));

        return { success: true };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Signup failed';
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        return { success: false, error: errorMessage };
      }
    },
    [supabase.auth, transformUser]
  );

  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setState({
        user: null,
        loading: false,
        error: null,
      });

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Logout failed';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, [supabase.auth]);

  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        throw error;
      }

      setState((prev) => ({
        ...prev,
        user: transformUser(data.user),
        loading: false,
        error: null,
      }));

      return { success: true };
    } catch (_error) {
      setState((prev) => ({
        ...prev,
        user: null,
        loading: false,
        error: null,
      }));
      return { success: false };
    }
  }, [supabase.auth, transformUser]);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
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
            user: transformUser(session?.user || null),
            loading: false,
            error: null,
          });
        }
      } catch (_error) {
        if (mounted) {
          setState({
            user: null,
            loading: false,
            error: 'Failed to initialize authentication',
          });
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        setState({
          user: transformUser(session?.user || null),
          loading: false,
          error: null,
        });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase.auth, transformUser]);

  return {
    ...state,
    login,
    signup,
    logout,
    refreshSession,
  };
};
