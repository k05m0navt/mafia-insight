import { z } from 'zod';

/**
 * Zod schema for validating raw player data scraped from gomafia.pro
 */
export const playerSchema = z.object({
  gomafiaId: z.string().min(1, 'Gomafia ID is required'),
  name: z
    .string()
    .min(1, 'Name must be at least 1 character')
    .max(50, 'Name must be at most 50 characters'),
  region: z.string().nullable(),
  club: z.string().nullable(),
  tournaments: z.number().int().min(0, 'Tournaments count cannot be negative'),
  ggPoints: z.number().int(),
  elo: z
    .number()
    .min(0, 'ELO rating cannot be negative')
    .max(5000, 'ELO rating seems unreasonably high'),
});

export type PlayerRawData = z.infer<typeof playerSchema>;
