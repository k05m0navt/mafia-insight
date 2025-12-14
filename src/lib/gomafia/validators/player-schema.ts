import { z } from 'zod';

/**
 * Zod schema for validating raw player data scraped from gomafia.pro
 * Enhanced with comprehensive validation (Task 4: AC #1, #2).
 */
export const playerSchema = z.object({
  gomafiaId: z.string().min(1, 'Gomafia ID is required and cannot be empty'),
  name: z
    .string()
    .min(1, 'Name must be at least 1 character')
    .max(50, 'Name must be at most 50 characters')
    .trim(),
  region: z
    .string()
    .max(50, 'Region name must be at most 50 characters')
    .nullable(),
  club: z
    .string()
    .max(100, 'Club name must be at most 100 characters')
    .nullable(),
  tournaments: z
    .number()
    .int()
    .min(0, 'Tournaments count cannot be negative')
    .max(10000, 'Tournaments count seems unreasonably high'),
  ggPoints: z
    .number()
    .int()
    .min(0, 'GG Points cannot be negative')
    .max(1000000, 'GG Points seems unreasonably high'),
  elo: z
    .number()
    .min(0, 'ELO rating cannot be negative')
    .max(5000, 'ELO rating seems unreasonably high'),
});

export type PlayerRawData = z.infer<typeof playerSchema>;
