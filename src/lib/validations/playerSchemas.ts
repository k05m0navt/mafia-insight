import { z } from 'zod';
import { EntitySyncStatusSchema } from './syncSchemas';

// Player sync data schema
export const PlayerSyncDataSchema = z
  .object({
    gomafiaId: z.string().min(1, 'Gomafia ID is required'),
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must be at most 50 characters'),
    eloRating: z.number().int().min(0).max(3000),
    totalGames: z.number().int().min(0),
    wins: z.number().int().min(0),
    losses: z.number().int().min(0),
    clubId: z.string().uuid().nullable().optional(),
    lastSyncAt: z.date().optional(),
    syncStatus: EntitySyncStatusSchema.optional(),
  })
  .refine((data) => data.wins + data.losses <= data.totalGames, {
    message: 'Wins + losses cannot exceed total games',
    path: ['totalGames'],
  })
  .refine((data) => data.wins + data.losses === data.totalGames, {
    message: 'Wins + losses must equal total games',
    path: ['wins', 'losses'],
  });

export type PlayerSyncData = z.infer<typeof PlayerSyncDataSchema>;

// Partial Player sync data (for updates)
export const PlayerSyncDataPartialSchema = PlayerSyncDataSchema.partial();

export type PlayerSyncDataPartial = z.infer<typeof PlayerSyncDataPartialSchema>;

// Player data from Gomafia
export const GomafiaPlayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  elo: z.number(),
  totalGames: z.number(),
  wins: z.number(),
  losses: z.number(),
  clubId: z.string().optional(),
});

export type GomafiaPlayer = z.infer<typeof GomafiaPlayerSchema>;
