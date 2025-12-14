import { z } from 'zod';

/**
 * Zod schema for validating raw game data scraped from gomafia.pro
 */
export const gameParticipationSchema = z
  .object({
    playerId: z.string().min(1, 'Player ID is required'),
    playerName: z
      .string()
      .min(1, 'Player name is required')
      .max(50, 'Player name must be at most 50 characters')
      .trim(),
    role: z.enum(['DON', 'MAFIA', 'SHERIFF', 'CITIZEN']).nullable(),
    team: z.enum(['BLACK', 'RED']).nullable(),
    isWinner: z.boolean(),
    performanceScore: z
      .number()
      .min(0, 'Performance score cannot be negative')
      .max(100, 'Performance score cannot exceed 100')
      .nullable(),
    eloChange: z
      .number()
      .min(-500, 'ELO change seems unreasonably low')
      .max(500, 'ELO change seems unreasonably high')
      .nullable(),
    isFirstShoot: z.boolean(),
    firstShootType: z
      .enum(['NONE', 'ZERO_MAFIA', 'ONE_TWO_MAFIA', 'THREE_MAFIA'])
      .nullable(),
  })
  .refine(
    (data) => {
      // Business rule: If role is set, team must also be set
      if (data.role && !data.team) {
        return false;
      }
      return true;
    },
    {
      message: 'If role is assigned, team must also be assigned',
      path: ['team'],
    }
  )
  .refine(
    (data) => {
      // Business rule: If team is set, role must also be set
      if (data.team && !data.role) {
        return false;
      }
      return true;
    },
    {
      message: 'If team is assigned, role must also be assigned',
      path: ['role'],
    }
  );

export const gameSchema = z
  .object({
    gomafiaId: z.string().min(1, 'Gomafia ID is required and cannot be empty'),
    tournamentId: z
      .string()
      .min(1, 'Tournament ID cannot be empty if provided')
      .nullable(),
    tableNumber: z
      .number()
      .int()
      .positive('Table number must be positive')
      .max(100, 'Table number seems unreasonably high')
      .nullable(),
    judgeId: z
      .string()
      .min(1, 'Judge ID cannot be empty if provided')
      .nullable(),
    date: z
      .string()
      .min(1, 'Date is required')
      .refine(
        (val) => {
          const date = new Date(val);
          return !isNaN(date.getTime());
        },
        { message: 'Date must be a valid date-time string' }
      ),
    durationMinutes: z
      .number()
      .int()
      .min(0, 'Duration cannot be negative')
      .max(1440, 'Duration cannot exceed 24 hours (1440 minutes)')
      .nullable(),
    winnerTeam: z.enum(['BLACK', 'RED', 'DRAW']).nullable(),
    status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
    participations: z
      .array(gameParticipationSchema)
      .max(20, 'Game cannot have more than 20 participants')
      .optional(),
  })
  .refine(
    (data) => {
      // Business rule: If game is COMPLETED, winnerTeam should be set (unless DRAW)
      if (data.status === 'COMPLETED' && !data.winnerTeam) {
        return false;
      }
      return true;
    },
    {
      message: 'Completed games must have a winner team (BLACK, RED, or DRAW)',
      path: ['winnerTeam'],
    }
  )
  .refine(
    (data) => {
      // Business rule: Date should be in valid range (not too far in past/future)
      const gameDate = new Date(data.date);
      const now = new Date();
      const tenYearsAgo = new Date(now.getFullYear() - 10, 0, 1);
      const oneYearFromNow = new Date(now.getFullYear() + 1, 11, 31);
      return gameDate >= tenYearsAgo && gameDate <= oneYearFromNow;
    },
    {
      message:
        'Game date must be within a reasonable range (not more than 10 years ago or 1 year in future)',
      path: ['date'],
    }
  );

export type GameRawData = z.infer<typeof gameSchema>;
export type GameParticipationRawData = z.infer<typeof gameParticipationSchema>;
