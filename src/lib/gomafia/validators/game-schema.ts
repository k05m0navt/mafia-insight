import { z } from 'zod';

/**
 * Zod schema for validating raw game data scraped from gomafia.pro
 */
export const gameSchema = z.object({
  gomafiaId: z.string().min(1, 'Gomafia ID is required'),
  tournamentId: z.string().nullable(),
  date: z.string(), // ISO date-time string
  durationMinutes: z
    .number()
    .int()
    .min(0, 'Duration cannot be negative')
    .nullable(),
  winnerTeam: z.enum(['BLACK', 'RED', 'DRAW']).nullable(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
});

export type GameRawData = z.infer<typeof gameSchema>;
