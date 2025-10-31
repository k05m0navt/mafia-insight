import { useState, useCallback } from 'react';

export interface Profile {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  role?: string;
  subscriptionTier?: string;
  themePreference?: string | null;
  createdAt: Date;
  lastLogin?: Date | null;
}

export interface ProfileUpdateData {
  name?: string;
  themePreference?: string;
}

export interface UseProfileResult {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (
    data: ProfileUpdateData
  ) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
}

export function useProfile(): UseProfileResult {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/profile');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch profile');
      }

      setProfile(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch profile';
      setError(errorMessage);
      console.error('Profile fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(
    async (
      data: ProfileUpdateData
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to update profile');
        }

        // Update local profile state
        if (result.profile) {
          setProfile(result.profile);
        }

        return { success: true };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update profile';
        setError(errorMessage);
        console.error('Profile update error:', err);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    profile,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
    clearError,
  };
}

export default useProfile;
