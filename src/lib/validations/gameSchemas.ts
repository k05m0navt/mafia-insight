import { z } from 'zod';
import { EntitySyncStatusSchema } from './syncSchemas';

// GameStatus enum (matches Prisma schema)
export const GameStatusSchema = z.enum([
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]);
export type GameStatus = z.infer<typeof GameStatusSchema>;

// WinnerTeam enum (matches Prisma schema)
export const WinnerTeamSchema = z.enum(['BLACK', 'RED', 'DRAW']);
export type WinnerTeam = z.infer<typeof WinnerTeamSchema>;

// PlayerRole enum (matches Prisma schema)
export const PlayerRoleSchema = z.enum(['DON', 'MAFIA', 'SHERIFF', 'CITIZEN']);
export type PlayerRole = z.infer<typeof PlayerRoleSchema>;

// Team enum (matches Prisma schema)
export const TeamSchema = z.enum(['BLACK', 'RED']);
export type Team = z.infer<typeof TeamSchema>;

// Game sync data schema
export const GameSyncDataSchema = z
  .object({
    gomafiaId: z.string().min(1, 'Gomafia ID is required'),
    tournamentId: z.string().uuid().nullable().optional(),
    date: z.date(),
    durationMinutes: z.number().int().min(0).nullable().optional(),
    winnerTeam: WinnerTeamSchema.nullable().optional(),
    status: GameStatusSchema.default('SCHEDULED'),
    lastSyncAt: z.date().optional(),
    syncStatus: EntitySyncStatusSchema.optional(),
  })
  .refine(
    (data) =>
      data.durationMinutes === null ||
      data.durationMinutes === undefined ||
      data.durationMinutes >= 0,
    {
      message: 'Duration must be non-negative',
      path: ['durationMinutes'],
    }
  );

export type GameSyncData = z.infer<typeof GameSyncDataSchema>;

// Partial Game sync data (for updates)
export const GameSyncDataPartialSchema = z.object({
  gomafiaId: z.string().min(1).optional(),
  tournamentId: z.string().uuid().nullable().optional(),
  date: z.date().optional(),
  durationMinutes: z.number().int().positive().nullable().optional(),
  winnerTeam: z.enum(['BLACK', 'RED', 'DRAW']).nullable().optional(),
  status: GameStatusSchema.optional(),
  lastSyncAt: z.date().optional(),
  syncStatus: EntitySyncStatusSchema.optional(),
});

export type GameSyncDataPartial = z.infer<typeof GameSyncDataPartialSchema>;

// Game participation data
export const GameParticipationSchema = z.object({
  playerId: z.string().uuid(),
  role: PlayerRoleSchema,
  team: TeamSchema,
  isWinner: z.boolean(),
  performanceScore: z.number().int().min(0).max(100).nullable().optional(),
});

export type GameParticipation = z.infer<typeof GameParticipationSchema>;

// Game data from Gomafia
export const GomafiaGameSchema = z.object({
  id: z.string(),
  tournamentId: z.string().optional(),
  date: z.string().transform((str) => new Date(str)),
  durationMinutes: z.number().optional(),
  winnerTeam: z.string().optional(),
  status: z.string(),
  participants: z.array(GameParticipationSchema),
});

export type GomafiaGame = z.infer<typeof GomafiaGameSchema>;
