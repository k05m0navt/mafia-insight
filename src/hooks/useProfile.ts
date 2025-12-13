'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Profile {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  role?: string;
  subscriptionTier?: string;
  themePreference?: string | null;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  createdAt: Date;
  lastLogin?: Date | null;
}

export interface ProfileUpdateData {
  name?: string;
  themePreference?: 'light' | 'dark' | 'system';
  emailNotifications?: boolean;
  pushNotifications?: boolean;
}

export interface AvatarUploadResponse {
  success: boolean;
  avatar?: string;
  message?: string;
  error?: string;
}

/**
 * Fetch profile data from API
 */
async function fetchProfile(): Promise<Profile> {
  const response = await fetch('/api/user/profile', {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch profile');
  }

  return response.json();
}

/**
 * Update profile data via API
 */
async function updateProfile(
  data: ProfileUpdateData
): Promise<{ success: boolean; profile: Profile; message: string }> {
  const response = await fetch('/api/user/profile', {
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

  return result;
}

/**
 * Upload avatar via API
 */
async function uploadAvatar(file: File): Promise<AvatarUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/user/profile/avatar', {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to upload avatar');
  }

  return result;
}

export interface UseProfileResult {
  profile: Profile | null;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  updateProfile: (
    data: ProfileUpdateData
  ) => Promise<{ success: boolean; error?: string }>;
  uploadAvatar: (file: File) => Promise<{ success: boolean; error?: string }>;
  refetch: () => void;
}

/**
 * useProfile hook
 * Uses TanStack Query for profile data fetching and mutations
 *
 * Features:
 * - Automatic caching and background refetching
 * - Optimistic updates for profile mutations
 * - Avatar upload mutation
 * - Query invalidation after successful updates
 */
export function useProfile(): UseProfileResult {
  const queryClient = useQueryClient();

  // Profile data query
  const {
    data: profile,
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Profile update mutation with optimistic updates
  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onMutate: async (newData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['profile'] });

      // Snapshot the previous value
      const previousProfile = queryClient.getQueryData<Profile>(['profile']);

      // Optimistically update to the new value
      if (previousProfile) {
        queryClient.setQueryData<Profile>(['profile'], {
          ...previousProfile,
          ...newData,
        });
      }

      // Return a context object with the snapshotted value
      return { previousProfile };
    },
    onError: (err, _newData, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousProfile) {
        queryClient.setQueryData(['profile'], context.previousProfile);
      }
    },
    onSuccess: (data) => {
      // Update query data with server response
      queryClient.setQueryData(['profile'], data.profile);
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  // Avatar upload mutation
  const avatarMutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (data) => {
      // Update profile with new avatar URL
      queryClient.setQueryData<Profile>(['profile'], (old) => {
        if (!old) return old;
        return {
          ...old,
          avatar: data.avatar || null,
        };
      });
      // Invalidate to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  return {
    profile: profile || null,
    isLoading,
    isFetching,
    error: error as Error | null,
    updateProfile: async (
      data: ProfileUpdateData
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        await updateMutation.mutateAsync(data);
        return { success: true };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update profile';
        return { success: false, error: errorMessage };
      }
    },
    uploadAvatar: async (
      file: File
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        await avatarMutation.mutateAsync(file);
        return { success: true };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to upload avatar';
        return { success: false, error: errorMessage };
      }
    },
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  };
}

export default useProfile;
