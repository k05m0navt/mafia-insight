/**
 * Language preference service
 * Manages language preferences for both guests (session storage) and authenticated users (database)
 */

import { guestSessionService } from './auth/guest-session';

export type SupportedLanguage = 'en' | 'ru' | 'uk';

const DEFAULT_LANGUAGE: SupportedLanguage = 'en';
const LANGUAGE_STORAGE_KEY = 'language';

/**
 * Language service for managing user language preferences
 */
export class LanguageService {
  private static instance: LanguageService;
  private currentLanguage: SupportedLanguage = DEFAULT_LANGUAGE;

  static getInstance(): LanguageService {
    if (!LanguageService.instance) {
      LanguageService.instance = new LanguageService();
    }
    return LanguageService.instance;
  }

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initializeLanguage();
    }
  }

  private initializeLanguage(): void {
    // Check for guest preferences in session storage first (for guests)
    let storedLanguage: SupportedLanguage | null = null;

    if (typeof window !== 'undefined') {
      try {
        // Try session storage for guest preferences
        const guestPrefs = sessionStorage.getItem('guest_preferences');
        if (guestPrefs) {
          const prefs = JSON.parse(guestPrefs);
          if (prefs.language && this.isValidLanguage(prefs.language)) {
            storedLanguage = prefs.language as SupportedLanguage;
          }
        }
      } catch (_error) {
        // Ignore session storage errors, fall back to localStorage
      }

      // Fall back to localStorage if no guest preference found
      if (!storedLanguage) {
        const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (stored && this.isValidLanguage(stored)) {
          storedLanguage = stored as SupportedLanguage;
        }
      }
    }

    if (storedLanguage) {
      this.currentLanguage = storedLanguage;
    } else {
      // Try to detect browser language
      if (typeof window !== 'undefined' && navigator.language) {
        const browserLang = navigator.language.split('-')[0];
        if (this.isValidLanguage(browserLang)) {
          this.currentLanguage = browserLang as SupportedLanguage;
        }
      }
    }
  }

  private isValidLanguage(lang: string): lang is SupportedLanguage {
    return ['en', 'ru', 'uk'].includes(lang);
  }

  getLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  setLanguage(language: SupportedLanguage, isGuest: boolean = false): void {
    if (!this.isValidLanguage(language)) {
      console.warn(
        `Invalid language: ${language}. Defaulting to ${DEFAULT_LANGUAGE}.`
      );
      language = DEFAULT_LANGUAGE;
    }

    this.currentLanguage = language;

    if (typeof window !== 'undefined') {
      if (isGuest) {
        // Store in session storage for guests using guest session service
        guestSessionService.setPreference('language', language);
      } else {
        // Store in localStorage for authenticated users
        localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      }
    }
  }

  /**
   * Get language preference for guest (from session storage)
   */
  getGuestLanguage(): SupportedLanguage {
    if (typeof window === 'undefined') {
      return DEFAULT_LANGUAGE;
    }

    const language = guestSessionService.getPreference('language');
    if (language && this.isValidLanguage(language)) {
      return language as SupportedLanguage;
    }

    return DEFAULT_LANGUAGE;
  }

  /**
   * Set language preference for guest (in session storage)
   */
  setGuestLanguage(language: SupportedLanguage): void {
    this.setLanguage(language, true);
  }
}

export const languageService = LanguageService.getInstance();
