import { z } from 'zod';

// Player sync data validation schema
export const PlayerSyncSchema = z
  .object({
    gomafiaId: z.string().min(1, 'Gomafia ID is required'),
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must be less than 50 characters'),
    eloRating: z
      .number()
      .int()
      .min(0, 'ELO rating must be non-negative')
      .max(3000, 'ELO rating must be less than 3000'),
    totalGames: z.number().int().min(0, 'Total games must be non-negative'),
    wins: z.number().int().min(0, 'Wins must be non-negative'),
    losses: z.number().int().min(0, 'Losses must be non-negative'),
    lastSyncAt: z.date().optional(),
    syncStatus: z.enum(['SYNCED', 'PENDING', 'ERROR']).optional(),
  })
  .refine((data) => data.wins + data.losses <= data.totalGames, {
    message: 'Wins + losses cannot exceed total games',
    path: ['wins', 'losses', 'totalGames'],
  })
  .refine((data) => data.wins + data.losses === data.totalGames, {
    message: 'Wins + losses must equal total games',
    path: ['wins', 'losses', 'totalGames'],
  });

// Game sync data validation schema
export const GameSyncSchema = z.object({
  gomafiaId: z.string().min(1, 'Gomafia ID is required'),
  date: z.date(),
  durationMinutes: z
    .number()
    .int()
    .positive('Duration must be positive')
    .optional(),
  winnerTeam: z.enum(['BLACK', 'RED', 'DRAW']).optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  lastSyncAt: z.date().optional(),
  syncStatus: z.enum(['SYNCED', 'PENDING', 'ERROR']).optional(),
});

// Partial player data validation (for incomplete data)
export const PartialPlayerSchema = z.object({
  gomafiaId: z.string().min(1, 'Gomafia ID is required'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),
  eloRating: z
    .number()
    .int()
    .min(0, 'ELO rating must be non-negative')
    .max(3000, 'ELO rating must be less than 3000'),
  totalGames: z
    .number()
    .int()
    .min(0, 'Total games must be non-negative')
    .optional(),
  wins: z.number().int().min(0, 'Wins must be non-negative').optional(),
  losses: z.number().int().min(0, 'Losses must be non-negative').optional(),
  lastSyncAt: z.date().optional(),
  syncStatus: z.enum(['SYNCED', 'PENDING', 'ERROR']).optional(),
});

// Validation functions
export function validatePlayerSyncData(data: any): {
  valid: boolean;
  errors: string[];
} {
  try {
    PlayerSyncSchema.parse(data);
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map(
          (err) => `${err.path.join('.')}: ${err.message}`
        ),
      };
    }
    return { valid: false, errors: ['Unknown validation error'] };
  }
}

export function validateGameSyncData(data: any): {
  valid: boolean;
  errors: string[];
} {
  try {
    GameSyncSchema.parse(data);
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map(
          (err) => `${err.path.join('.')}: ${err.message}`
        ),
      };
    }
    return { valid: false, errors: ['Unknown validation error'] };
  }
}

export function validatePartialPlayerData(data: any): {
  valid: boolean;
  errors: string[];
} {
  try {
    PartialPlayerSchema.parse(data);
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map(
          (err) => `${err.path.join('.')}: ${err.message}`
        ),
      };
    }
    return { valid: false, errors: ['Unknown validation error'] };
  }
}

// Check if data is complete
export function isCompletePlayerData(data: any): boolean {
  return (
    data.name &&
    data.eloRating !== undefined &&
    data.totalGames !== undefined &&
    data.wins !== undefined &&
    data.losses !== undefined
  );
}

// Check if data is partial
export function isPartialPlayerData(data: any): boolean {
  return (
    data.gomafiaId &&
    data.name &&
    data.eloRating !== undefined &&
    (data.totalGames === undefined ||
      data.wins === undefined ||
      data.losses === undefined)
  );
}

// Check if data is empty
export function isEmptyPlayerData(data: any): boolean {
  return !data || !data.gomafiaId || !data.name;
}
