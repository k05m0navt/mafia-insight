import { z } from 'zod';

// User validation
export const UserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(50),
  avatar: z.string().url().optional(),
  subscriptionTier: z.enum(['FREE', 'PREMIUM', 'CLUB', 'ENTERPRISE']),
});

// Player validation
export const PlayerSchema = z
  .object({
    gomafiaId: z.string().min(1),
    name: z.string().min(2).max(50),
    eloRating: z.number().int().min(0).max(3000),
    totalGames: z.number().int().min(0),
    wins: z.number().int().min(0),
    losses: z.number().int().min(0),
  })
  .refine((data) => data.wins + data.losses === data.totalGames, {
    message: 'Wins + losses must equal total games',
  });

// Player update validation (without gomafiaId)
export const PlayerUpdateSchema = z
  .object({
    name: z.string().min(2).max(50).optional(),
    eloRating: z.number().int().min(0).max(3000).optional(),
    totalGames: z.number().int().min(0).optional(),
    wins: z.number().int().min(0).optional(),
    losses: z.number().int().min(0).optional(),
  })
  .refine(
    (data) => {
      if (
        data.wins !== undefined &&
        data.losses !== undefined &&
        data.totalGames !== undefined
      ) {
        return data.wins + data.losses === data.totalGames;
      }
      return true;
    },
    {
      message: 'Wins + losses must equal total games',
    }
  );

// Game validation
export const GameSchema = z.object({
  gomafiaId: z.string().min(1),
  date: z.date(),
  durationMinutes: z.number().int().positive().optional(),
  winnerTeam: z.enum(['BLACK', 'RED', 'DRAW']).optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
});

// Club validation
export const ClubSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  logoUrl: z.string().url().optional(),
});

// Tournament validation
export const TournamentSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  startDate: z.date(),
  endDate: z.date().optional(),
  maxParticipants: z.number().int().positive().optional(),
  entryFee: z.number().min(0).optional(),
  prizePool: z.number().min(0).optional(),
});

// API Response schemas
export const PaginationSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1).max(100),
  total: z.number().int().min(0),
  pages: z.number().int().min(0),
});

export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.record(z.any()).optional(),
  timestamp: z.string().datetime(),
});

// Type exports
export type User = z.infer<typeof UserSchema>;
export type Player = z.infer<typeof PlayerSchema>;
export type Game = z.infer<typeof GameSchema>;
export type Club = z.infer<typeof ClubSchema>;
export type Tournament = z.infer<typeof TournamentSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
