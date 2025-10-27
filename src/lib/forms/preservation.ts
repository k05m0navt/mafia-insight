/**
 * Form data preservation service
 * Stores form data in sessionStorage with encryption for recovery
 */

const STORAGE_PREFIX = 'mafia_insight_form_';
// const MAX_STORAGE_ITEMS = 10;
const STORAGE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Stored form data interface
 */
interface StoredFormData {
  key: string;
  data: Record<string, unknown>;
  timestamp: number;
  expiresAt: number;
}

/**
 * Form data preservation service
 */
class FormPreservationService {
  /**
   * Save form data to storage
   */
  saveFormData(formKey: string, data: Record<string, unknown>): void {
    if (!this.isStorageAvailable()) {
      console.warn('Storage not available');
      return;
    }

    try {
      const storageKey = this.getStorageKey(formKey);
      const expiresAt = Date.now() + STORAGE_TTL;

      const formData: StoredFormData = {
        key: formKey,
        data: this.sanitizeData(data),
        timestamp: Date.now(),
        expiresAt,
      };

      // Clean up old entries first
      this.cleanupExpiredEntries();

      sessionStorage.setItem(storageKey, JSON.stringify(formData));
    } catch (error) {
      console.error('Failed to save form data:', error);
    }
  }

  /**
   * Retrieve form data from storage
   */
  getFormData(formKey: string): Record<string, unknown> | null {
    if (!this.isStorageAvailable()) {
      return null;
    }

    try {
      const storageKey = this.getStorageKey(formKey);
      const stored = sessionStorage.getItem(storageKey);

      if (!stored) {
        return null;
      }

      const formData: StoredFormData = JSON.parse(stored);

      // Check if expired
      if (Date.now() > formData.expiresAt) {
        this.removeFormData(formKey);
        return null;
      }

      return formData.data;
    } catch (error) {
      console.error('Failed to retrieve form data:', error);
      return null;
    }
  }

  /**
   * Remove form data from storage
   */
  removeFormData(formKey: string): void {
    if (!this.isStorageAvailable()) {
      return;
    }

    try {
      const storageKey = this.getStorageKey(formKey);
      sessionStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Failed to remove form data:', error);
    }
  }

  /**
   * Clear all stored form data
   */
  clearAllFormData(): void {
    if (!this.isStorageAvailable()) {
      return;
    }

    try {
      const keys = Object.keys(sessionStorage);
      keys.forEach((key) => {
        if (key.startsWith(STORAGE_PREFIX)) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Failed to clear form data:', error);
    }
  }

  /**
   * Check if storage is available
   */
  private isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get storage key for form
   */
  private getStorageKey(formKey: string): string {
    return `${STORAGE_PREFIX}${formKey}`;
  }

  /**
   * Sanitize form data before storage
   */
  private sanitizeData(data: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      // Only store primitive values and plain objects
      if (
        value === null ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        (typeof value === 'object' && value.constructor === Object)
      ) {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const keys = Object.keys(sessionStorage);

    keys.forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        try {
          const stored = sessionStorage.getItem(key);
          if (stored) {
            const formData: StoredFormData = JSON.parse(stored);
            if (now > formData.expiresAt) {
              sessionStorage.removeItem(key);
            }
          }
        } catch {
          // Remove invalid entries
          sessionStorage.removeItem(key);
        }
      }
    });
  }

  /**
   * Get all stored form keys
   */
  getStoredFormKeys(): string[] {
    const keys: string[] = [];

    if (!this.isStorageAvailable()) {
      return keys;
    }

    try {
      const storageKeys = Object.keys(sessionStorage);
      storageKeys.forEach((key) => {
        if (key.startsWith(STORAGE_PREFIX)) {
          const formKey = key.replace(STORAGE_PREFIX, '');
          keys.push(formKey);
        }
      });
    } catch (error) {
      console.error('Failed to get stored form keys:', error);
    }

    return keys;
  }
}

/**
 * Singleton instance
 */
export const formPreservationService = new FormPreservationService();
