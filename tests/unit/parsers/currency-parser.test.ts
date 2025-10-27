import { describe, it, expect } from 'vitest';
import { parsePrizeMoney } from '@/lib/gomafia/parsers/currency-parser';

describe('Currency Parser', () => {
  it('should parse simple ruble amount', () => {
    expect(parsePrizeMoney('60000 ₽')).toBe(60000);
  });

  it('should parse amount with space thousands separator', () => {
    expect(parsePrizeMoney('60 000 ₽')).toBe(60000);
    expect(parsePrizeMoney('1 500 000 ₽')).toBe(1500000);
  });

  it('should parse decimal amounts', () => {
    expect(parsePrizeMoney('1 500,50 ₽')).toBe(1500.5);
    expect(parsePrizeMoney('1500.50 ₽')).toBe(1500.5);
  });

  it('should return null for empty values', () => {
    expect(parsePrizeMoney('')).toBeNull();
    expect(parsePrizeMoney('   ')).toBeNull();
    expect(parsePrizeMoney(null)).toBeNull();
  });

  it('should return null for dash/missing indicator', () => {
    expect(parsePrizeMoney('–')).toBeNull();
    expect(parsePrizeMoney('-')).toBeNull();
  });

  it('should handle amounts without currency symbol', () => {
    expect(parsePrizeMoney('50000')).toBe(50000);
    expect(parsePrizeMoney('50 000')).toBe(50000);
  });

  it('should throw error for invalid format', () => {
    expect(() => parsePrizeMoney('invalid')).toThrow(
      'Invalid prize money format'
    );
    expect(() => parsePrizeMoney('abc123')).toThrow(
      'Invalid prize money format'
    );
  });

  it('should throw error for negative amounts', () => {
    expect(() => parsePrizeMoney('-5000 ₽')).toThrow(
      'Invalid prize money format'
    );
  });

  it('should handle various currency formats', () => {
    expect(parsePrizeMoney('10 000 руб')).toBe(10000);
    expect(parsePrizeMoney('10000 руб.')).toBe(10000);
    expect(parsePrizeMoney('10000р')).toBe(10000);
  });

  it('should parse very large amounts', () => {
    expect(parsePrizeMoney('5 000 000 ₽')).toBe(5000000);
  });

  it('should handle comma as decimal separator', () => {
    expect(parsePrizeMoney('123,45 ₽')).toBe(123.45);
  });

  it('should handle period as decimal separator', () => {
    expect(parsePrizeMoney('123.45 ₽')).toBe(123.45);
  });
});
