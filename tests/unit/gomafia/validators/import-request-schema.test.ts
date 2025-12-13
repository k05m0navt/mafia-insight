import { describe, it, expect } from 'vitest';
import {
  historicalImportRequestSchema,
  extractPlayerIdFromUrl,
} from '@/lib/gomafia/validators/import-request-schema';

describe('historicalImportRequestSchema', () => {
  describe('profileUrl validation', () => {
    it('should accept valid gomafia.pro stats URL', () => {
      const result = historicalImportRequestSchema.safeParse({
        profileUrl: 'https://gomafia.pro/stats/123',
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid gomafia.pro player URL', () => {
      const result = historicalImportRequestSchema.safeParse({
        profileUrl: 'https://gomafia.pro/player/456',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid URL format', () => {
      const result = historicalImportRequestSchema.safeParse({
        profileUrl: 'not-a-url',
      });
      expect(result.success).toBe(false);
      if (!result.success && result.error.issues.length > 0) {
        const errorMessages = result.error.issues
          .map((e) => e.message)
          .join(' ');
        expect(errorMessages).toMatch(/Invalid URL|gomafia\.pro/i);
      }
    });

    it('should reject non-gomafia.pro URLs', () => {
      const result = historicalImportRequestSchema.safeParse({
        profileUrl: 'https://example.com/stats/123',
      });
      expect(result.success).toBe(false);
      if (!result.success && result.error.issues.length > 0) {
        const errorMessages = result.error.issues
          .map((e) => e.message)
          .join(' ');
        expect(errorMessages).toMatch(/gomafia\.pro/i);
      }
    });

    it('should reject gomafia.pro URLs that are not profile pages', () => {
      const result = historicalImportRequestSchema.safeParse({
        profileUrl: 'https://gomafia.pro/tournaments',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('playerId validation', () => {
    it('should accept numeric player ID', () => {
      const result = historicalImportRequestSchema.safeParse({
        playerId: '123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject non-numeric player ID', () => {
      const result = historicalImportRequestSchema.safeParse({
        playerId: 'abc',
      });
      expect(result.success).toBe(false);
      if (!result.success && result.error.issues.length > 0) {
        const errorMessages = result.error.issues
          .map((e) => e.message)
          .join(' ');
        expect(errorMessages).toMatch(/numeric/i);
      }
    });

    it('should reject empty player ID', () => {
      const result = historicalImportRequestSchema.safeParse({
        playerId: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('order validation', () => {
    it('should accept oldest-first', () => {
      const result = historicalImportRequestSchema.safeParse({
        playerId: '123',
        order: 'oldest-first',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.order).toBe('oldest-first');
      }
    });

    it('should accept newest-first', () => {
      const result = historicalImportRequestSchema.safeParse({
        playerId: '123',
        order: 'newest-first',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.order).toBe('newest-first');
      }
    });

    it('should default to newest-first when not provided', () => {
      const result = historicalImportRequestSchema.safeParse({
        playerId: '123',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.order).toBe('newest-first');
      }
    });

    it('should reject invalid order value', () => {
      const result = historicalImportRequestSchema.safeParse({
        playerId: '123',
        order: 'invalid',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('required field validation', () => {
    it('should require either profileUrl or playerId', () => {
      const result = historicalImportRequestSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success && result.error.issues.length > 0) {
        const errorMessages = result.error.issues
          .map((e) => e.message)
          .join(' ');
        expect(errorMessages).toMatch(/profileUrl|playerId|must be provided/i);
      }
    });

    it('should accept profileUrl without playerId', () => {
      const result = historicalImportRequestSchema.safeParse({
        profileUrl: 'https://gomafia.pro/stats/123',
      });
      expect(result.success).toBe(true);
    });

    it('should accept playerId without profileUrl', () => {
      const result = historicalImportRequestSchema.safeParse({
        playerId: '123',
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('extractPlayerIdFromUrl', () => {
  it('should extract player ID from stats URL', () => {
    const playerId = extractPlayerIdFromUrl('https://gomafia.pro/stats/123');
    expect(playerId).toBe('123');
  });

  it('should extract player ID from player URL', () => {
    const playerId = extractPlayerIdFromUrl('https://gomafia.pro/player/456');
    expect(playerId).toBe('456');
  });

  it('should return null for invalid URL', () => {
    const playerId = extractPlayerIdFromUrl('not-a-valid-url');
    expect(playerId).toBe(null);
  });

  it('should return null for non-gomafia.pro domain', () => {
    const playerId = extractPlayerIdFromUrl('https://example.com/stats/123');
    expect(playerId).toBe(null);
  });

  it('should return null for non-profile URLs', () => {
    const playerId = extractPlayerIdFromUrl('https://gomafia.pro/tournaments');
    expect(playerId).toBe(null);
  });

  it('should handle URLs with query parameters', () => {
    const playerId = extractPlayerIdFromUrl(
      'https://gomafia.pro/stats/123?tab=history'
    );
    expect(playerId).toBe('123');
  });
});
