import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import {
  getAllNotifications,
  getUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/services/sync/notificationService';

/**
 * GET /api/notifications
 * Get user's notifications
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const notifications = unreadOnly
      ? await getUnreadNotifications(authUser.id)
      : await getAllNotifications(authUser.id, limit);

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications
 * Mark notifications as read
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      const success = await markAllNotificationsAsRead(authUser.id);
      if (!success) {
        return NextResponse.json(
          { error: 'Failed to mark notifications as read' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read',
      });
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: 'notificationId or markAll is required' },
        { status: 400 }
      );
    }

    const success = await markNotificationAsRead(notificationId, authUser.id);
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to mark notification as read' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    console.error('Update notification error:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}
