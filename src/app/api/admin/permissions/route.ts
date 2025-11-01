import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { requireAuthCookie } from '@/lib/utils/apiAuth';
import { prisma } from '@/lib/db';
import { Permission, PermissionUpdate } from '@/types/permissions';

// In-memory storage for permissions (in production, this should be in database)
// Key: permission ID, Value: Permission object
const permissionsCache = new Map<string, Permission>();

// Initialize default permissions
function getDefaultPermissions(): Permission[] {
  return [
    {
      id: 'perm_players_read',
      resource: 'players',
      action: 'read',
      roles: ['user', 'admin'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'perm_players_write',
      resource: 'players',
      action: 'write',
      roles: ['admin'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'perm_players_admin',
      resource: 'players',
      action: 'admin',
      roles: ['admin'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'perm_tournaments_read',
      resource: 'tournaments',
      action: 'read',
      roles: ['user', 'admin'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'perm_tournaments_write',
      resource: 'tournaments',
      action: 'write',
      roles: ['admin'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'perm_tournaments_admin',
      resource: 'tournaments',
      action: 'admin',
      roles: ['admin'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'perm_clubs_read',
      resource: 'clubs',
      action: 'read',
      roles: ['user', 'admin'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'perm_clubs_write',
      resource: 'clubs',
      action: 'write',
      roles: ['admin'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'perm_clubs_admin',
      resource: 'clubs',
      action: 'admin',
      roles: ['admin'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'perm_games_read',
      resource: 'games',
      action: 'read',
      roles: ['user', 'admin'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'perm_games_write',
      resource: 'games',
      action: 'write',
      roles: ['admin'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'perm_games_admin',
      resource: 'games',
      action: 'admin',
      roles: ['admin'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'perm_admin_read',
      resource: 'admin',
      action: 'read',
      roles: ['admin'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'perm_admin_write',
      resource: 'admin',
      action: 'write',
      roles: ['admin'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'perm_admin_admin',
      resource: 'admin',
      action: 'admin',
      roles: ['admin'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
}

// Initialize cache with default permissions if empty
function initializeCacheIfNeeded(): void {
  if (permissionsCache.size === 0) {
    const defaults = getDefaultPermissions();
    defaults.forEach((perm) => {
      permissionsCache.set(perm.id, perm);
    });
  }
}

/**
 * GET /api/admin/permissions
 * Get all permissions for admin management (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Check auth-token cookie
    const authError = requireAuthCookie(request);
    if (authError) {
      return authError;
    }

    // Verify with Supabase for user data
    const supabase = await createRouteHandlerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const userProfile = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { role: true },
    });

    if (userProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Initialize cache if needed
    initializeCacheIfNeeded();

    // Return all permissions from cache
    const permissions = Array.from(permissionsCache.values());

    return NextResponse.json({
      permissions,
    });
  } catch (error) {
    console.error('Get permissions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/permissions
 * Update permissions for admin management (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    // Check auth-token cookie
    const authError = requireAuthCookie(request);
    if (authError) {
      return authError;
    }

    // Verify with Supabase for user data
    const supabase = await createRouteHandlerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const userProfile = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { role: true },
    });

    if (userProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { permissions }: { permissions: PermissionUpdate[] } = body;

    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Invalid request: permissions must be an array' },
        { status: 400 }
      );
    }

    // Initialize cache if needed
    initializeCacheIfNeeded();

    // Update permissions in cache
    for (const update of permissions) {
      const existingPermission = permissionsCache.get(update.id);
      if (existingPermission) {
        // Update the permission with new roles
        const updatedPermission: Permission = {
          ...existingPermission,
          roles: update.roles,
          updatedAt: new Date(),
        };
        permissionsCache.set(update.id, updatedPermission);
      } else {
        console.warn(`Permission with id ${update.id} not found in cache`);
      }
    }

    // Return updated permissions
    const updatedPermissions = Array.from(permissionsCache.values());

    return NextResponse.json({
      message: 'Permissions updated successfully',
      permissions: updatedPermissions,
    });
  } catch (error) {
    console.error('Update permissions error:', error);
    return NextResponse.json(
      { error: 'Failed to update permissions' },
      { status: 500 }
    );
  }
}
