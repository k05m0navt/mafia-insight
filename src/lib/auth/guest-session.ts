/**
 * Guest session management service
 * Manages temporary guest session preferences (theme, language) in session storage
 * No database interaction - session-only storage
 */

export type GuestPreferenceKey = 'theme' | 'language';

export interface GuestPreferences {
  theme?: 'light' | 'dark';
  language?: string;
}

const GUEST_PREFERENCES_KEY = 'guest_preferences';

/**
 * Guest session service for managing temporary guest preferences
 */
export class GuestSessionService {
  private static instance: GuestSessionService;

  static getInstance(): GuestSessionService {
    if (!GuestSessionService.instance) {
      GuestSessionService.instance = new GuestSessionService();
    }
    return GuestSessionService.instance;
  }

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Check if running in browser environment
   */
  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  /**
   * Get all guest preferences from session storage
   */
  getPreferences(): GuestPreferences {
    if (!this.isBrowser()) {
      return {};
    }

    try {
      const stored = sessionStorage.getItem(GUEST_PREFERENCES_KEY);
      if (!stored) {
        return {};
      }

      return JSON.parse(stored) as GuestPreferences;
    } catch (error) {
      console.warn('Failed to parse guest preferences:', error);
      return {};
    }
  }

  /**
   * Get a specific guest preference
   */
  getPreference(key: GuestPreferenceKey): string | undefined {
    const preferences = this.getPreferences();
    return preferences[key];
  }

  /**
   * Set a guest preference
   */
  setPreference(key: GuestPreferenceKey, value: string): void {
    if (!this.isBrowser()) {
      return;
    }

    // Validate theme values
    if (key === 'theme' && !['light', 'dark'].includes(value)) {
      console.warn(`Invalid theme value: ${value}. Must be 'light' or 'dark'.`);
      return;
    }

    // Validate language values (basic check - should be a valid language code)
    if (
      (key === 'language' && typeof value !== 'string') ||
      value.length === 0
    ) {
      console.warn(
        `Invalid language value: ${value}. Must be a non-empty string.`
      );
      return;
    }

    try {
      const preferences = this.getPreferences();
      if (key === 'theme') {
        preferences[key] = value as 'light' | 'dark';
      } else {
        preferences[key] = value;
      }
      sessionStorage.setItem(
        GUEST_PREFERENCES_KEY,
        JSON.stringify(preferences)
      );
    } catch (error) {
      console.warn('Failed to save guest preference:', error);
    }
  }

  /**
   * Set multiple guest preferences at once
   */
  setPreferences(preferences: Partial<GuestPreferences>): void {
    if (!this.isBrowser()) {
      return;
    }

    try {
      const current = this.getPreferences();
      const updated = { ...current, ...preferences };
      sessionStorage.setItem(GUEST_PREFERENCES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to save guest preferences:', error);
    }
  }

  /**
   * Clear all guest preferences (useful when user signs in)
   */
  clearSession(): void {
    if (!this.isBrowser()) {
      return;
    }

    try {
      sessionStorage.removeItem(GUEST_PREFERENCES_KEY);
    } catch (error) {
      console.warn('Failed to clear guest session:', error);
    }
  }

  /**
   * Check if guest session exists
   */
  hasSession(): boolean {
    if (!this.isBrowser()) {
      return false;
    }

    return sessionStorage.getItem(GUEST_PREFERENCES_KEY) !== null;
  }
}

// Export singleton instance
export const guestSessionService = GuestSessionService.getInstance();
