import { z } from 'zod';

/**
 * API validation schemas using Zod
 */

// Search validation
export const searchQuerySchema = z.object({
  q: z.string().min(1).max(255).optional(),
  region: z.string().optional(),
  year: z.number().int().min(2020).max(2030).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

// User role validation
export const userRoleSchema = z.enum(['GUEST', 'USER', 'ADMIN']);

// Theme validation
export const themeSchema = z.enum(['light', 'dark', 'system']);

export const themeUpdateSchema = z.object({
  theme: themeSchema,
  customColors: z.record(z.string(), z.string()).optional(),
});

// Import progress validation
export const importProgressSchema = z.object({
  id: z.string(),
  operation: z.string(),
  progress: z.number().int().min(0).max(100),
  totalRecords: z.number().int().min(0),
  processedRecords: z.number().int().min(0),
  errors: z.number().int().min(0),
  startTime: z.date(),
  estimatedCompletion: z.date().optional(),
  status: z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']),
});

// Region validation
export const regionSchema = z.object({
  id: z.string(),
  code: z.string().min(2).max(10),
  name: z.string().min(1).max(100),
  country: z.string().max(100).optional(),
  isActive: z.boolean().default(true),
  playerCount: z.number().int().min(0).default(0),
});

// Navigation validation
export const navigationItemSchema: z.ZodType<unknown> = z.object({
  id: z.string(),
  label: z.string().min(1),
  href: z.string().min(1),
  icon: z.string().optional(),
  requiredRole: userRoleSchema,
  isVisible: z.boolean().default(true),
  order: z.number().int().min(0),
  children: z.array(z.lazy(() => navigationItemSchema)).optional(),
});

// API response validation
export const paginationSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});

export const searchResponseSchema = z.object({
  items: z.array(z.unknown()),
  pagination: paginationSchema,
  searchTime: z.number().optional(),
});

// Club validation
export const ClubSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  region: z.string().max(10).optional(),
  memberCount: z.number().int().min(0).default(0),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Tournament validation
export const TournamentSchema = z.object({
  id: z.string(),
  gomafiaId: z.string().optional(),
  name: z.string().min(1).max(200),
  date: z.date(),
  prizeMoney: z.number().min(0).default(0),
  maxPlayers: z.number().int().min(2).default(16),
  region: z.string().max(10).optional(),
  status: z
    .enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
    .default('SCHEDULED'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Player validation
export const PlayerSchema = z.object({
  id: z.string(),
  userId: z.string(),
  gomafiaId: z.string().optional(),
  name: z.string().min(1).max(100),
  eloRating: z.number().min(0).default(1000),
  totalGames: z.number().int().min(0).default(0),
  wins: z.number().int().min(0).default(0),
  losses: z.number().int().min(0).default(0),
  region: z.string().max(10).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const PlayerUpdateSchema = PlayerSchema.partial().omit({
  id: true,
  userId: true,
});

// Game validation
export const GameSchema = z.object({
  id: z.string(),
  gomafiaId: z.string().optional(),
  tournamentId: z.string().optional(),
  date: z.date(),
  durationMinutes: z.number().int().min(0).optional(),
  winnerTeam: z.enum(['BLACK', 'RED']).optional(),
  status: z
    .enum(['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED'])
    .default('SCHEDULED'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Error validation
export const errorSchema = z.object({
  error: z.string(),
  message: z.string(),
  code: z.string().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});

// Type exports
export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
export type Theme = z.infer<typeof themeSchema>;
export type ThemeUpdate = z.infer<typeof themeUpdateSchema>;
export type ImportProgress = z.infer<typeof importProgressSchema>;
export type Region = z.infer<typeof regionSchema>;
export type NavigationItem = z.infer<typeof navigationItemSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type SearchResponse<T> = {
  items: T[];
  pagination: Pagination;
  searchTime?: number;
};
export type ErrorResponse = z.infer<typeof errorSchema>;
