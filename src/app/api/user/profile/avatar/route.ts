import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import { authenticateRequest } from '@/lib/apiAuth';
import sharp from 'sharp';

// Avatar upload validation schema
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB as per story requirements
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_DIMENSIONS = 512; // Max 512x512px as per story
const THUMBNAIL_DIMENSIONS = 128; // 128x128px thumbnail as per story

/**
 * Validate image file
 */
function validateImageFile(file: File): { valid: boolean; error?: string } {
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
      error: `File type must be one of: JPG, PNG, WebP`,
    };
  }

  return { valid: true };
}

/**
 * POST /api/user/profile/avatar
 * Upload user avatar with image processing
 *
 * Features:
 * - Validates image file (max 5MB, formats: JPG, PNG, WebP)
 * - Resizes image to max 512x512px
 * - Compresses image before storage
 * - Generates thumbnail version (128x128px)
 * - Uploads to Supabase Storage in avatars/ bucket
 * - Updates user avatar URL in database
 * - Deletes old avatar if exists
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticateRequest(request);

    // Get file from form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const supabase = await createRouteHandlerClient();

    // Convert File to Buffer for sharp processing
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process main image: resize to max 512x512px, compress, convert to WebP
    const processedImage = await sharp(buffer)
      .resize(MAX_DIMENSIONS, MAX_DIMENSIONS, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 85 }) // Compress with 85% quality
      .toBuffer();

    // Generate thumbnail: resize to 128x128px, compress, convert to WebP
    const thumbnail = await sharp(buffer)
      .resize(THUMBNAIL_DIMENSIONS, THUMBNAIL_DIMENSIONS, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 80 }) // Slightly lower quality for thumbnail
      .toBuffer();

    // Get current profile to check for existing avatar
    const currentProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { avatar: true },
    });

    // Delete old avatar if it exists (both main and thumbnail)
    if (currentProfile?.avatar) {
      try {
        // Extract file path from URL
        const urlParts = currentProfile.avatar.split('/avatars/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1].split('?')[0]; // Remove query params
          const thumbnailPath = filePath.replace('.webp', '_thumb.webp');
          // Remove both main image and thumbnail
          await supabase.storage
            .from('avatars')
            .remove([filePath, thumbnailPath]);
        }
      } catch (deleteError) {
        // Non-critical error, log and continue
        console.warn('Failed to delete old avatar:', deleteError);
      }
    }

    // Generate unique filenames
    const timestamp = Date.now();
    const mainFileName = `${user.id}-${timestamp}.webp`;
    const thumbnailFileName = `${user.id}-${timestamp}_thumb.webp`;

    // Upload processed main image to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(mainFileName, processedImage, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'image/webp',
      });

    if (uploadError) {
      console.error('Avatar upload error:', uploadError);
      return NextResponse.json(
        { error: uploadError.message || 'Failed to upload avatar' },
        { status: 500 }
      );
    }

    // Upload thumbnail to Supabase Storage
    const { error: thumbnailUploadError } = await supabase.storage
      .from('avatars')
      .upload(thumbnailFileName, thumbnail, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'image/webp',
      });

    if (thumbnailUploadError) {
      console.warn(
        'Thumbnail upload error (non-critical):',
        thumbnailUploadError
      );
      // Continue even if thumbnail upload fails
    }

    // Get public URL for main image
    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(mainFileName);

    // Update user profile with new avatar URL
    const updatedProfile = await prisma.user.update({
      where: { id: user.id },
      data: {
        avatar: publicUrl,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        avatar: true,
      },
    });

    return NextResponse.json({
      success: true,
      avatar: updatedProfile.avatar,
      message: 'Avatar uploaded successfully',
    });
  } catch (error) {
    console.error('Avatar upload error:', error);

    if (
      error instanceof Error &&
      error.message.includes('Authentication required')
    ) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/profile/avatar
 * Delete user avatar
 */
export async function DELETE(request: NextRequest) {
  try {
    const { user } = await authenticateRequest(request);

    const supabase = await createRouteHandlerClient();

    // Get current profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { avatar: true },
    });

    if (!currentProfile?.avatar) {
      return NextResponse.json(
        { error: 'No avatar to delete' },
        { status: 404 }
      );
    }

    // Extract file path from URL
    const urlParts = currentProfile.avatar.split('/avatars/');
    if (urlParts.length < 2) {
      return NextResponse.json(
        { error: 'Invalid avatar URL' },
        { status: 400 }
      );
    }

    const filePath = urlParts[1].split('?')[0]; // Remove query params

    // Delete file from Supabase Storage
    const { error: deleteError } = await supabase.storage
      .from('avatars')
      .remove([filePath]);

    if (deleteError) {
      console.error('Avatar deletion error:', deleteError);
      return NextResponse.json(
        { error: deleteError.message || 'Failed to delete avatar' },
        { status: 500 }
      );
    }

    // Update user profile to remove avatar URL
    await prisma.user.update({
      where: { id: user.id },
      data: {
        avatar: null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Avatar deleted successfully',
    });
  } catch (error) {
    console.error('Avatar deletion error:', error);

    if (
      error instanceof Error &&
      error.message.includes('Authentication required')
    ) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete avatar' },
      { status: 500 }
    );
  }
}
