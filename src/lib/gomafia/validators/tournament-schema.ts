import { z } from 'zod';

/**
 * Zod schema for validating raw tournament data scraped from gomafia.pro
 */
export const tournamentSchema = z.object({
  gomafiaId: z.string().min(1, 'Gomafia ID is required'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(200, 'Name must be at most 200 characters'),
  stars: z
    .number()
    .int()
    .min(0, 'Stars cannot be negative')
    .max(5, 'Stars cannot exceed 5')
    .nullable(),
  averageElo: z.number().min(0).max(5000).nullable(),
  isFsmRated: z.boolean(),
  startDate: z.string(), // ISO date string
  endDate: z.string().nullable(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  participants: z
    .number()
    .int()
    .min(0, 'Participants count cannot be negative'),
});

export type TournamentRawData = z.infer<typeof tournamentSchema>;
