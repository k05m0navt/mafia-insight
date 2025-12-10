import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  GuestSessionService,
  guestSessionService,
  type GuestPreferences,
} from '@/lib/auth/guest-session';

describe('GuestSessionService', () => {
  beforeEach(() => {
    // Clear session storage before each test
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
    }
  });

  describe('getInstance', () => {
    it('should return a singleton instance', () => {
      const instance1 = GuestSessionService.getInstance();
      const instance2 = GuestSessionService.getInstance();
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(guestSessionService);
    });
  });

  describe('getPreferences', () => {
    it('should return empty object when no preferences stored', () => {
      const prefs = guestSessionService.getPreferences();
      expect(prefs).toEqual({});
    });

    it('should return stored preferences', () => {
      const testPrefs: GuestPreferences = {
        theme: 'dark',
        language: 'ru',
      };
      sessionStorage.setItem('guest_preferences', JSON.stringify(testPrefs));

      const prefs = guestSessionService.getPreferences();
      expect(prefs).toEqual(testPrefs);
    });

    it('should return empty object on parse error', () => {
      sessionStorage.setItem('guest_preferences', 'invalid json');
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const prefs = guestSessionService.getPreferences();
      expect(prefs).toEqual({});
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should return empty object when not in browser', () => {
      const originalWindow = global.window;
      // @ts-expect-error - testing SSR scenario
      delete global.window;

      const prefs = guestSessionService.getPreferences();
      expect(prefs).toEqual({});

      global.window = originalWindow;
    });
  });

  describe('getPreference', () => {
    it('should return undefined for non-existent preference', () => {
      const theme = guestSessionService.getPreference('theme');
      expect(theme).toBeUndefined();
    });

    it('should return stored preference value', () => {
      const testPrefs: GuestPreferences = {
        theme: 'dark',
        language: 'ru',
      };
      sessionStorage.setItem('guest_preferences', JSON.stringify(testPrefs));

      expect(guestSessionService.getPreference('theme')).toBe('dark');
      expect(guestSessionService.getPreference('language')).toBe('ru');
    });
  });

  describe('setPreference', () => {
    it('should store theme preference', () => {
      guestSessionService.setPreference('theme', 'dark');
      const prefs = guestSessionService.getPreferences();
      expect(prefs.theme).toBe('dark');
    });

    it('should store language preference', () => {
      guestSessionService.setPreference('language', 'ru');
      const prefs = guestSessionService.getPreferences();
      expect(prefs.language).toBe('ru');
    });

    it('should validate and reject invalid theme values', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      guestSessionService.setPreference('theme', 'invalid');
      const prefs = guestSessionService.getPreferences();

      expect(prefs.theme).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should validate and reject invalid language values', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      guestSessionService.setPreference('language', '');
      const prefs = guestSessionService.getPreferences();

      expect(prefs.language).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should update existing preference', () => {
      guestSessionService.setPreference('theme', 'light');
      guestSessionService.setPreference('theme', 'dark');

      const prefs = guestSessionService.getPreferences();
      expect(prefs.theme).toBe('dark');
    });

    it('should handle storage errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Mock sessionStorage.setItem to throw
      const originalSetItem = sessionStorage.setItem;
      sessionStorage.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      guestSessionService.setPreference('theme', 'dark');
      expect(consoleSpy).toHaveBeenCalled();

      sessionStorage.setItem = originalSetItem;
      consoleSpy.mockRestore();
    });

    it('should not store preference when not in browser', () => {
      const originalWindow = global.window;
      // @ts-expect-error - testing SSR scenario
      delete global.window;

      guestSessionService.setPreference('theme', 'dark');
      // Should not throw, but also not store anything

      global.window = originalWindow;
    });
  });

  describe('setPreferences', () => {
    it('should set multiple preferences at once', () => {
      guestSessionService.setPreferences({
        theme: 'dark',
        language: 'ru',
      });

      const prefs = guestSessionService.getPreferences();
      expect(prefs.theme).toBe('dark');
      expect(prefs.language).toBe('ru');
    });

    it('should merge with existing preferences', () => {
      guestSessionService.setPreference('theme', 'light');
      guestSessionService.setPreferences({
        language: 'ru',
      });

      const prefs = guestSessionService.getPreferences();
      expect(prefs.theme).toBe('light');
      expect(prefs.language).toBe('ru');
    });

    it('should overwrite existing preferences', () => {
      guestSessionService.setPreference('theme', 'light');
      guestSessionService.setPreferences({
        theme: 'dark',
      });

      const prefs = guestSessionService.getPreferences();
      expect(prefs.theme).toBe('dark');
    });
  });

  describe('clearSession', () => {
    it('should remove all preferences from session storage', () => {
      guestSessionService.setPreferences({
        theme: 'dark',
        language: 'ru',
      });

      guestSessionService.clearSession();
      const prefs = guestSessionService.getPreferences();
      expect(prefs).toEqual({});
    });

    it('should handle clear errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Mock sessionStorage.removeItem to throw
      const originalRemoveItem = sessionStorage.removeItem;
      sessionStorage.removeItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      guestSessionService.clearSession();
      expect(consoleSpy).toHaveBeenCalled();

      sessionStorage.removeItem = originalRemoveItem;
      consoleSpy.mockRestore();
    });
  });

  describe('hasSession', () => {
    it('should return false when no session exists', () => {
      expect(guestSessionService.hasSession()).toBe(false);
    });

    it('should return true when session exists', () => {
      guestSessionService.setPreference('theme', 'dark');
      expect(guestSessionService.hasSession()).toBe(true);
    });

    it('should return false after clearing session', () => {
      guestSessionService.setPreference('theme', 'dark');
      guestSessionService.clearSession();
      expect(guestSessionService.hasSession()).toBe(false);
    });
  });
});
