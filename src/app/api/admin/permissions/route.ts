import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { requireAuthCookie } from '@/lib/utils/apiAuth';
import { prisma } from '@/lib/db';
import { resilientDB } from '@/lib/db-resilient';
import { Permission, PermissionUpdate } from '@/types/permissions';

// Cache to track if default permissions have been initialized
let defaultPermissionsInitialized = false;

// Initialize default permissions in database (only if needed)
async function initializeDefaultPermissions(): Promise<void> {
  // Skip if already initialized (permissions exist)
  if (defaultPermissionsInitialized) {
    return;
  }

  // Quick check: count existing permissions
  const existingCount = await resilientDB.execute((prisma) =>
    prisma.permission.count()
  );
  if (existingCount >= 15) {
    // All default permissions likely exist, mark as initialized
    defaultPermissionsInitialized = true;
    return;
  }

  const defaultPermissions = [
    {
      id: 'perm_players_read',
      resource: 'players',
      action: 'read',
      roles: ['user', 'admin', 'guest'],
    },
    {
      id: 'perm_players_write',
      resource: 'players',
      action: 'write',
      roles: ['admin'],
    },
    {
      id: 'perm_players_admin',
      resource: 'players',
      action: 'admin',
      roles: ['admin'],
    },
    {
      id: 'perm_tournaments_read',
      resource: 'tournaments',
      action: 'read',
      roles: ['user', 'admin', 'guest'],
    },
    {
      id: 'perm_tournaments_write',
      resource: 'tournaments',
      action: 'write',
      roles: ['admin'],
    },
    {
      id: 'perm_tournaments_admin',
      resource: 'tournaments',
      action: 'admin',
      roles: ['admin'],
    },
    {
      id: 'perm_clubs_read',
      resource: 'clubs',
      action: 'read',
      roles: ['user', 'admin', 'guest'],
    },
    {
      id: 'perm_clubs_write',
      resource: 'clubs',
      action: 'write',
      roles: ['admin'],
    },
    {
      id: 'perm_clubs_admin',
      resource: 'clubs',
      action: 'admin',
      roles: ['admin'],
    },
    {
      id: 'perm_games_read',
      resource: 'games',
      action: 'read',
      roles: ['user', 'admin', 'guest'],
    },
    {
      id: 'perm_games_write',
      resource: 'games',
      action: 'write',
      roles: ['admin'],
    },
    {
      id: 'perm_games_admin',
      resource: 'games',
      action: 'admin',
      roles: ['admin'],
    },
    {
      id: 'perm_admin_read',
      resource: 'admin',
      action: 'read',
      roles: ['admin'],
    },
    {
      id: 'perm_admin_write',
      resource: 'admin',
      action: 'write',
      roles: ['admin'],
    },
    {
      id: 'perm_admin_admin',
      resource: 'admin',
      action: 'admin',
      roles: ['admin'],
    },
  ];

  // Upsert all default permissions in parallel for better performance
  await Promise.all(
    defaultPermissions.map((perm) =>
      resilientDB.execute((prisma) =>
        prisma.permission.upsert({
          where: {
            resource_action: {
              resource: perm.resource,
              action: perm.action,
            },
          },
          update: {
            roles: perm.roles,
          },
          create: {
            id: perm.id,
            resource: perm.resource,
            action: perm.action,
            roles: perm.roles,
          },
        })
      )
    )
  );

  defaultPermissionsInitialized = true;
}

// Get all permissions from database
async function getAllPermissionsFromDB(): Promise<Permission[]> {
  const dbPermissions = await resilientDB.execute((prisma) =>
    prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    })
  );

  return dbPermissions.map((perm) => ({
    id: perm.id,
    resource: perm.resource,
    action: perm.action as 'read' | 'write' | 'admin',
    roles: perm.roles,
    createdAt: perm.createdAt,
    updatedAt: perm.updatedAt,
  }));
}

/**
 * GET /api/admin/permissions
 * Get all permissions - readable by all users (including guests)
 * This allows the frontend to check permissions without requiring authentication
 */
export async function GET(_request: NextRequest) {
  try {
    // Allow all users (including guests) to read permissions
    // No authentication required - permissions are public data

    // Ensure default permissions exist in database
    await initializeDefaultPermissions();

    // Get all permissions from database
    const permissions = await getAllPermissionsFromDB();

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

    // Update permissions in database - use parallel updates for better performance
    const startTime = Date.now();
    const updatePromises = permissions.map(async (update) => {
      try {
        // Direct update - will throw if permission doesn't exist, which is fine
        return await prisma.permission.update({
          where: { id: update.id },
          data: {
            roles: update.roles,
          },
        });
      } catch (error: any) {
        // If permission doesn't exist, log warning but don't fail the entire request
        if (error.code === 'P2025') {
          console.warn(`Permission with id ${update.id} not found in database`);
          return null;
        }
        throw error;
      }
    });

    // Wait for all updates to complete in parallel
    await Promise.all(updatePromises);
    const updateTime = Date.now() - startTime;
    console.log(
      `[Permissions API] Updated ${permissions.length} permission(s) in ${updateTime}ms`
    );

    // Fetch all permissions to return complete list
    const allPermissions = await getAllPermissionsFromDB();

    return NextResponse.json({
      message: 'Permissions updated successfully',
      permissions: allPermissions,
    });
  } catch (error) {
    console.error('Update permissions error:', error);
    return NextResponse.json(
      { error: 'Failed to update permissions' },
      { status: 500 }
    );
  }
}
