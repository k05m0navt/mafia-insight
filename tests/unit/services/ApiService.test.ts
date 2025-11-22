import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PermissionService } from '@/services/permissionService';
import type { PermissionUpdate } from '@/types/permissions';

const service = PermissionService.getInstance();

function mockFetch(response: unknown, ok = true, init?: ResponseInit) {
  return vi.spyOn(global, 'fetch' as never).mockResolvedValue(
    new Response(JSON.stringify(response), {
      status: ok ? 200 : 400,
      headers: { 'Content-Type': 'application/json' },
      ...init,
    }) as unknown as Promise<Response>
  );
}

describe('PermissionService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    service.setPermissions([]);
    (service as any).updatePermissionConfig({
      players: {
        read: ['user', 'admin'],
        write: ['admin'],
        admin: ['admin'],
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('retrieves permissions from the API', async () => {
    const permissions = [
      {
        id: 'view_players',
        roles: ['user'],
        resource: 'players',
        action: 'read',
      },
    ];

    const fetchSpy = mockFetch({ permissions });

    const result = await service.getAllPermissions();

    expect(fetchSpy).toHaveBeenCalledWith('/api/auth/admin/permissions', {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    expect(result).toEqual(permissions);
  });

  it('updates permissions and refreshes local cache', async () => {
    const update: PermissionUpdate[] = [
      {
        id: 'write_players',
        roles: ['admin'],
        resource: 'players',
        action: 'write',
      },
    ];

    const fetchSpy = vi
      .spyOn(global, 'fetch' as never)
      .mockImplementation((url: RequestInfo | URL) => {
        const href = typeof url === 'string' ? url : url.toString();
        if (href.includes('/admin/permissions')) {
          return Promise.resolve(
            new Response('{}', {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }) as unknown as Response
          );
        }

        return Promise.resolve(
          new Response(JSON.stringify({ permissions: ['read:players'] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }) as unknown as Response
        );
      });

    await service.updatePermissions(update);

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/auth/admin/permissions');
    expect(service.getPermissions()).toEqual(['read:players']);
  });

  it('evaluates role permissions correctly', () => {
    service.setPermissions(['read:players']);

    expect(service.hasPermission('read:players')).toBe(true);
    expect(service.hasAnyPermission(['write:players', 'read:players'])).toBe(
      true
    );
    expect(service.hasAllPermissions(['read:players'])).toBe(true);
    expect(service.hasAllPermissions(['read:players', 'write:players'])).toBe(
      false
    );
  });

  it('determines page access requirements', () => {
    service.setPermissions(['read:players']);

    expect(service.canAccessPage('home')).toBe(true);
    expect(service.canAccessPage('players')).toBe(true);
    expect(service.canAccessPage('admin')).toBe(false);
  });

  it('derives permissions for a role from configuration', () => {
    const permissions = service.getPermissionsForRole('admin');

    expect(permissions).toContain('read:players');
    expect(permissions).toContain('write:players');
    expect(permissions).toContain('admin:players');
  });

  it('validates permission updates', () => {
    const invalid = service.validatePermissionUpdate({
      id: '',
      roles: [],
      resource: '',
      action: 'read',
    });

    expect(invalid.isValid).toBe(false);
    expect(invalid.errors).toContain('Permission ID is required');
    expect(invalid.errors).toContain('At least one role must be specified');

    const valid = service.validatePermissionUpdate({
      id: 'players_read',
      roles: ['admin'],
      resource: 'players',
      action: 'read',
    });

    expect(valid.isValid).toBe(true);
    expect(valid.errors).toHaveLength(0);
  });
});
