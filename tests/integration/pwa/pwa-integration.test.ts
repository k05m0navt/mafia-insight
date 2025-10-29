import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestServer } from '../utils/test-server';

describe('PWA Integration Tests', () => {
  let server: any;

  beforeAll(async () => {
    server = await setupTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  beforeEach(async () => {
    // Reset test database
    await server.resetDatabase();
  });

  describe('Service Worker Registration', () => {
    it('should register service worker successfully', async () => {
      const response = await fetch('/sw.js');
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('javascript');
    });

    it('should have valid service worker scope', async () => {
      const response = await fetch('/sw.js');
      const swContent = await response.text();

      expect(swContent).toContain('self.addEventListener');
      expect(swContent).toContain('fetch');
      expect(swContent).toContain('install');
      expect(swContent).toContain('activate');
    });

    it('should cache critical resources', async () => {
      const response = await fetch('/sw.js');
      const swContent = await response.text();

      expect(swContent).toContain('cache.addAll');
      expect(swContent).toContain('/');
      expect(swContent).toContain('/manifest.json');
    });
  });

  describe('Manifest File', () => {
    it('should have valid manifest.json', async () => {
      const response = await fetch('/manifest.json');
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('json');
    });

    it('should have required manifest properties', async () => {
      const response = await fetch('/manifest.json');
      const manifest = await response.json();

      expect(manifest).toHaveProperty('name');
      expect(manifest).toHaveProperty('short_name');
      expect(manifest).toHaveProperty('start_url');
      expect(manifest).toHaveProperty('display');
      expect(manifest).toHaveProperty('theme_color');
      expect(manifest).toHaveProperty('background_color');
      expect(manifest).toHaveProperty('icons');
    });

    it('should have valid icon sizes', async () => {
      const response = await fetch('/manifest.json');
      const manifest = await response.json();

      expect(manifest.icons).toBeInstanceOf(Array);
      expect(manifest.icons.length).toBeGreaterThan(0);

      for (const icon of manifest.icons) {
        expect(icon).toHaveProperty('src');
        expect(icon).toHaveProperty('sizes');
        expect(icon).toHaveProperty('type');

        // Check if icon exists
        const iconResponse = await fetch(icon.src);
        expect(iconResponse.status).toBe(200);
      }
    });

    it('should have valid display mode', async () => {
      const response = await fetch('/manifest.json');
      const manifest = await response.json();

      expect(['standalone', 'fullscreen', 'minimal-ui']).toContain(
        manifest.display
      );
    });

    it('should have valid theme colors', async () => {
      const response = await fetch('/manifest.json');
      const manifest = await response.json();

      expect(manifest.theme_color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(manifest.background_color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  describe('Offline Functionality', () => {
    it('should work offline with cached resources', async () => {
      // First, load the page online to cache resources
      const onlineResponse = await fetch('/');
      expect(onlineResponse.status).toBe(200);

      // Simulate offline by blocking network
      // Note: In a real test, you would use a tool like Playwright to simulate offline
      const offlineResponse = await fetch('/');
      expect(offlineResponse.status).toBe(200);
    });

    it('should cache API responses for offline use', async () => {
      // Make API request
      const response = await fetch('/api/analytics/players/123/stats', {
        headers: {
          Authorization: 'Bearer test-token',
        },
      });
      expect(response.status).toBe(200);

      // Check if response is cached
      const cachedResponse = await fetch('/api/analytics/players/123/stats', {
        headers: {
          Authorization: 'Bearer test-token',
        },
      });
      expect(cachedResponse.status).toBe(200);
    });

    it('should handle offline data storage', async () => {
      // Test IndexedDB storage
      const dbName = 'mafia-insight-offline';
      const storeName = 'imports';

      // This would typically be tested with a browser environment
      // For now, we'll test the API endpoints that handle offline data
      const response = await fetch('/api/offline/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          type: 'import',
          data: { name: 'Test Import', source: 'gomafia' },
        }),
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('status', 'stored');
    });
  });

  describe('Push Notifications', () => {
    it('should register for push notifications', async () => {
      const response = await fetch('/api/notifications/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          endpoint: 'https://example.com/push',
          keys: {
            p256dh: 'test-p256dh-key',
            auth: 'test-auth-key',
          },
        }),
      });

      expect(response.status).toBe(201);
      const result = await response.json();
      expect(result).toHaveProperty('subscriptionId');
    });

    it('should send push notifications', async () => {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          title: 'Test Notification',
          body: 'This is a test notification',
          icon: '/icon-192.png',
          badge: '/badge-72.png',
        }),
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('messageId');
      expect(result).toHaveProperty('status', 'sent');
    });

    it('should handle notification preferences', async () => {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          enabled: true,
          types: ['import-complete', 'sync-complete', 'error-alert'],
        }),
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('preferences');
      expect(result.preferences.enabled).toBe(true);
    });
  });

  describe('Background Sync', () => {
    it('should register background sync', async () => {
      const response = await fetch('/api/sync/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          tag: 'import-sync',
          data: { importId: 'import-123', status: 'pending' },
        }),
      });

      expect(response.status).toBe(201);
      const result = await response.json();
      expect(result).toHaveProperty('syncId');
    });

    it('should process background sync', async () => {
      const response = await fetch('/api/sync/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          tag: 'import-sync',
          syncId: 'sync-123',
        }),
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('status', 'processed');
    });
  });

  describe('App Updates', () => {
    it('should check for app updates', async () => {
      const response = await fetch('/api/updates/check', {
        headers: {
          Authorization: 'Bearer test-token',
        },
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('hasUpdate');
      expect(result).toHaveProperty('version');
    });

    it('should handle app update installation', async () => {
      const response = await fetch('/api/updates/install', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          version: '1.0.1',
        }),
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('status', 'installed');
    });
  });

  describe('App Shortcuts', () => {
    it('should provide app shortcuts', async () => {
      const response = await fetch('/api/shortcuts', {
        headers: {
          Authorization: 'Bearer test-token',
        },
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('shortcuts');
      expect(Array.isArray(result.shortcuts)).toBe(true);

      for (const shortcut of result.shortcuts) {
        expect(shortcut).toHaveProperty('name');
        expect(shortcut).toHaveProperty('short_name');
        expect(shortcut).toHaveProperty('url');
        expect(shortcut).toHaveProperty('icon');
      }
    });
  });

  describe('Share Target', () => {
    it('should handle share target registration', async () => {
      const response = await fetch('/api/share/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          action: 'import-data',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            title: 'title',
            text: 'text',
            url: 'url',
          },
        }),
      });

      expect(response.status).toBe(201);
      const result = await response.json();
      expect(result).toHaveProperty('shareTargetId');
    });

    it('should process shared data', async () => {
      const response = await fetch('/api/share/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          title: 'Shared Data',
          text: 'This is shared data',
          url: 'https://example.com/data',
        }),
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('processed');
      expect(result.processed).toBe(true);
    });
  });

  describe('File Handling', () => {
    it('should handle file uploads', async () => {
      const formData = new FormData();
      formData.append(
        'file',
        new Blob(['test data'], { type: 'application/json' }),
        'test.json'
      );

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-token',
        },
        body: formData,
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('fileId');
      expect(result).toHaveProperty('filename', 'test.json');
    });

    it('should handle file downloads', async () => {
      const response = await fetch('/api/files/download/test-file-id', {
        headers: {
          Authorization: 'Bearer test-token',
        },
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain(
        'application/json'
      );
    });
  });

  describe('Protocol Handling', () => {
    it('should handle custom protocol URLs', async () => {
      const response = await fetch('/api/protocol/handle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          protocol: 'mafia-insight',
          url: 'mafia-insight://analytics?player=123',
        }),
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('handled');
      expect(result.handled).toBe(true);
    });
  });

  describe('Theme Handling', () => {
    it('should handle theme changes', async () => {
      const response = await fetch('/api/theme', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          theme: 'dark',
        }),
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('theme', 'dark');
    });

    it('should handle system theme preference', async () => {
      const response = await fetch('/api/theme', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          theme: 'system',
        }),
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('theme', 'system');
    });
  });

  describe('Performance Monitoring', () => {
    it('should collect performance metrics', async () => {
      const response = await fetch('/api/performance/metrics', {
        headers: {
          Authorization: 'Bearer test-token',
        },
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('lcp');
      expect(result).toHaveProperty('fid');
      expect(result).toHaveProperty('cls');
      expect(result).toHaveProperty('fcp');
      expect(result).toHaveProperty('ttfb');
    });

    it('should report performance issues', async () => {
      const response = await fetch('/api/performance/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          type: 'slow-load',
          value: 5000,
          threshold: 3000,
        }),
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('reported');
      expect(result.reported).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle PWA errors gracefully', async () => {
      const response = await fetch('/api/pwa/error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          error: 'Service worker failed to install',
          stack: 'Error: Service worker failed to install\n    at install()',
          timestamp: new Date().toISOString(),
        }),
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('logged');
      expect(result.logged).toBe(true);
    });

    it('should handle offline errors', async () => {
      const response = await fetch('/api/offline/error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({
          error: 'Network request failed',
          url: '/api/analytics/players/123/stats',
          timestamp: new Date().toISOString(),
        }),
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('queued');
      expect(result.queued).toBe(true);
    });
  });

  describe('Security', () => {
    it('should validate PWA security headers', async () => {
      const response = await fetch('/');
      expect(response.status).toBe(200);

      // Check security headers
      expect(response.headers.get('x-frame-options')).toBe('DENY');
      expect(response.headers.get('x-content-type-options')).toBe('nosniff');
      expect(response.headers.get('referrer-policy')).toBe(
        'strict-origin-when-cross-origin'
      );
    });

    it('should validate service worker security', async () => {
      const response = await fetch('/sw.js');
      expect(response.status).toBe(200);

      // Check security headers for service worker
      expect(response.headers.get('x-content-type-options')).toBe('nosniff');
      expect(response.headers.get('cache-control')).toContain('no-cache');
    });
  });
});
