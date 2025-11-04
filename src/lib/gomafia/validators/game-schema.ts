import { z } from 'zod';

/**
 * Zod schema for validating raw game data scraped from gomafia.pro
 */
export const gameParticipationSchema = z.object({
  playerId: z.string(),
  playerName: z.string(),
  role: z.enum(['DON', 'MAFIA', 'SHERIFF', 'CITIZEN']).nullable(),
  team: z.enum(['BLACK', 'RED']).nullable(),
  isWinner: z.boolean(),
  performanceScore: z.number().nullable(),
  eloChange: z.number().nullable(),
  isFirstShoot: z.boolean(),
  firstShootType: z
    .enum(['NONE', 'ZERO_MAFIA', 'ONE_TWO_MAFIA', 'THREE_MAFIA'])
    .nullable(),
});

export const gameSchema = z.object({
  gomafiaId: z.string().min(1, 'Gomafia ID is required'),
  tournamentId: z.string().nullable(),
  tableNumber: z.number().int().positive().nullable(),
  judgeId: z.string().nullable(),
  date: z.string(), // ISO date-time string
  durationMinutes: z
    .number()
    .int()
    .min(0, 'Duration cannot be negative')
    .nullable(),
  winnerTeam: z.enum(['BLACK', 'RED', 'DRAW']).nullable(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  participations: z.array(gameParticipationSchema).optional(),
});

export type GameRawData = z.infer<typeof gameSchema>;
export type GameParticipationRawData = z.infer<typeof gameParticipationSchema>;
