import { describe, it, expect } from 'vitest';
import {
  clubSchema,
  type ClubRawData,
} from '@/lib/gomafia/validators/club-schema';

describe('Club Schema Validation', () => {
  it('should validate correct club data', () => {
    const validClub: ClubRawData = {
      gomafiaId: 'club-123',
      name: 'Клуб "Мафия Москва"',
      region: 'Москва',
      president: 'Иван Иванов',
      members: 50,
    };

    const result = clubSchema.safeParse(validClub);
    expect(result.success).toBe(true);
  });

  it('should reject club with missing required fields', () => {
    const invalidClub = {
      name: 'Test Club',
      // Missing gomafiaId
    };

    const result = clubSchema.safeParse(invalidClub);
    expect(result.success).toBe(false);
  });

  it('should accept club with null optional fields', () => {
    const clubWithNulls: ClubRawData = {
      gomafiaId: 'club-456',
      name: 'Simple Club',
      region: null,
      president: null,
      members: 0,
    };

    const result = clubSchema.safeParse(clubWithNulls);
    expect(result.success).toBe(true);
  });

  it('should validate name length', () => {
    const clubShortName: ClubRawData = {
      gomafiaId: 'club-789',
      name: 'A',
      region: null,
      president: null,
      members: 0,
    };

    const result = clubSchema.safeParse(clubShortName);
    expect(result.success).toBe(false);
  });

  it('should validate members count is non-negative', () => {
    const clubNegativeMembers: ClubRawData = {
      gomafiaId: 'club-999',
      name: 'Invalid Club',
      region: null,
      president: null,
      members: -5,
    };

    const result = clubSchema.safeParse(clubNegativeMembers);
    expect(result.success).toBe(false);
  });
});
