import { supabase } from './client';
import { createSupabaseServiceRoleClient } from './server';

/**
 * Avatar Storage Utility
 * Handles user avatar upload, deletion, and management in Supabase Storage
 */

const BUCKET_NAME = 'avatars';
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

/**
 * Validate avatar file before upload
 */
export function validateAvatarFile(file: File): {
  valid: boolean;
  error?: string;
} {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type must be one of: ${ALLOWED_MIME_TYPES.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Upload user avatar to Supabase Storage
 * @param userId - User ID
 * @param file - Avatar file to upload
 * @returns Public URL of the uploaded avatar
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<{ url?: string; error?: string }> {
  try {
    // Validate file
    const validation = validateAvatarFile(file);
    if (!validation.valid) {
      return { error: validation.error };
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload file to Supabase Storage
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true, // Replace existing file if it exists
      });

    if (error) {
      console.error('Avatar upload error:', error);
      return { error: error.message };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

    return { url: publicUrl };
  } catch (error) {
    console.error('Unexpected error during avatar upload:', error);
    return { error: 'Failed to upload avatar' };
  }
}

/**
 * Delete user avatar from Supabase Storage
 * @param avatarUrl - Public URL of the avatar to delete
 * @returns Success status
 */
export async function deleteAvatar(
  avatarUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Extract file path from URL
    const urlParts = avatarUrl.split(`/${BUCKET_NAME}/`);
    if (urlParts.length < 2) {
      return { success: false, error: 'Invalid avatar URL' };
    }

    const filePath = urlParts[1];

    // Delete file from Supabase Storage
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Avatar deletion error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error during avatar deletion:', error);
    return { success: false, error: 'Failed to delete avatar' };
  }
}

/**
 * Update user avatar (delete old, upload new)
 * @param userId - User ID
 * @param newFile - New avatar file
 * @param oldAvatarUrl - URL of old avatar to delete (optional)
 * @returns Public URL of the new avatar
 */
export async function updateAvatar(
  userId: string,
  newFile: File,
  oldAvatarUrl?: string
): Promise<{ url?: string; error?: string }> {
  try {
    // Delete old avatar if it exists
    if (oldAvatarUrl) {
      await deleteAvatar(oldAvatarUrl);
    }

    // Upload new avatar
    return await uploadAvatar(userId, newFile);
  } catch (error) {
    console.error('Unexpected error during avatar update:', error);
    return { error: 'Failed to update avatar' };
  }
}

/**
 * Get avatar URL with transformation (resize, optimize)
 * @param avatarUrl - Original avatar URL
 * @param width - Desired width
 * @param height - Desired height
 * @returns Transformed avatar URL
 */
export function getTransformedAvatarUrl(
  avatarUrl: string,
  width: number = 200,
  height: number = 200
): string {
  // Supabase Storage transformation
  const urlParts = avatarUrl.split(`/${BUCKET_NAME}/`);
  if (urlParts.length < 2) {
    return avatarUrl;
  }

  const [baseUrl, filePath] = urlParts;
  return `${baseUrl}/${BUCKET_NAME}/public/${filePath}?width=${width}&height=${height}`;
}

/**
 * Create Supabase Storage bucket (run once during setup)
 * This should be executed manually or via migration script
 */
export async function createAvatarBucket(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const adminClient = createSupabaseServiceRoleClient();

    // Create bucket
    const { error: bucketError } = await adminClient.storage.createBucket(
      BUCKET_NAME,
      {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: ALLOWED_MIME_TYPES,
      }
    );

    if (bucketError) {
      // Bucket might already exist
      if (bucketError.message.includes('already exists')) {
        return { success: true };
      }
      console.error('Bucket creation error:', bucketError);
      return { success: false, error: bucketError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error during bucket creation:', error);
    return { success: false, error: 'Failed to create avatar bucket' };
  }
}
