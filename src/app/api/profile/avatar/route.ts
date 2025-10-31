import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import {
  uploadAvatar,
  deleteAvatar,
  validateAvatarFile,
} from '@/lib/supabase/storage';

/**
 * POST /api/profile/avatar
 * Upload user avatar
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get file from form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file
    const validation = validateAvatarFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Get current profile to check for existing avatar
    const currentProfile = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { avatar: true },
    });

    // Delete old avatar if it exists
    if (currentProfile?.avatar) {
      await deleteAvatar(currentProfile.avatar);
    }

    // Upload new avatar
    const uploadResult = await uploadAvatar(authUser.id, file);

    if (uploadResult.error) {
      return NextResponse.json({ error: uploadResult.error }, { status: 500 });
    }

    // Update user profile with new avatar URL
    const updatedProfile = await prisma.user.update({
      where: { id: authUser.id },
      data: {
        avatar: uploadResult.url,
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
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profile/avatar
 * Delete user avatar
 */
export async function DELETE(_request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current profile
    const currentProfile = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { avatar: true },
    });

    if (!currentProfile?.avatar) {
      return NextResponse.json(
        { error: 'No avatar to delete' },
        { status: 404 }
      );
    }

    // Delete avatar from storage
    const deleteResult = await deleteAvatar(currentProfile.avatar);

    if (!deleteResult.success) {
      return NextResponse.json(
        { error: deleteResult.error || 'Failed to delete avatar' },
        { status: 500 }
      );
    }

    // Update user profile to remove avatar URL
    await prisma.user.update({
      where: { id: authUser.id },
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
    return NextResponse.json(
      { error: 'Failed to delete avatar' },
      { status: 500 }
    );
  }
}
