import { z } from 'zod';

/**
 * Zod schema for validating raw club data scraped from gomafia.pro
 * Enhanced with comprehensive validation (Task 4: AC #1, #2).
 */
export const clubSchema = z.object({
  gomafiaId: z.string().min(1, 'Gomafia ID is required and cannot be empty'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters')
    .trim(),
  region: z
    .string()
    .max(50, 'Region name must be at most 50 characters')
    .nullable(),
  president: z
    .string()
    .max(100, 'President name must be at most 100 characters')
    .nullable(),
  members: z
    .number()
    .int()
    .min(0, 'Members count cannot be negative')
    .max(10000, 'Members count seems unreasonably high'),
});

export type ClubRawData = z.infer<typeof clubSchema>;
