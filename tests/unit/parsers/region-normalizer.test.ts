import { describe, it, expect } from 'vitest';
import { normalizeRegion } from '@/lib/gomafia/parsers/region-normalizer';

describe('Region Normalizer', () => {
  it('should normalize Moscow variants', () => {
    expect(normalizeRegion('Москва')).toBe('Москва');
    expect(normalizeRegion('МСК')).toBe('Москва');
    expect(normalizeRegion('Moscow')).toBe('Москва');
  });

  it('should normalize Saint Petersburg variants', () => {
    expect(normalizeRegion('Санкт-Петербург')).toBe('Санкт-Петербург');
    expect(normalizeRegion('СПб')).toBe('Санкт-Петербург');
    expect(normalizeRegion('Питер')).toBe('Санкт-Петербург');
    expect(normalizeRegion('Saint Petersburg')).toBe('Санкт-Петербург');
    expect(normalizeRegion('St. Petersburg')).toBe('Санкт-Петербург');
  });

  it('should normalize Nizhny Novgorod variants', () => {
    expect(normalizeRegion('Нижний Новгород')).toBe('Нижний Новгород');
    expect(normalizeRegion('Н.Новгород')).toBe('Нижний Новгород');
    expect(normalizeRegion('Nizhny Novgorod')).toBe('Нижний Новгород');
  });

  it('should return null for empty or whitespace strings', () => {
    expect(normalizeRegion('')).toBeNull();
    expect(normalizeRegion('   ')).toBeNull();
    expect(normalizeRegion(null)).toBeNull();
  });

  it('should trim whitespace', () => {
    expect(normalizeRegion('  Москва  ')).toBe('Москва');
    expect(normalizeRegion('  СПб  ')).toBe('Санкт-Петербург');
  });

  it('should preserve unknown regions as-is', () => {
    expect(normalizeRegion('Казань')).toBe('Казань');
    expect(normalizeRegion('Екатеринбург')).toBe('Екатеринбург');
  });

  it('should be case-sensitive for Russian names', () => {
    // Exact match required for Russian names
    expect(normalizeRegion('МОСКВА')).toBe('МОСКВА'); // Not normalized
    expect(normalizeRegion('Москва')).toBe('Москва'); // Normalized
  });
});
