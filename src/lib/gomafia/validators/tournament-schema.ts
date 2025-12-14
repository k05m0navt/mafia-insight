import { z } from 'zod';

/**
 * Zod schema for validating raw tournament data scraped from gomafia.pro
 * Enhanced with comprehensive validation (Task 4: AC #1, #2).
 */
export const tournamentSchema = z
  .object({
    gomafiaId: z.string().min(1, 'Gomafia ID is required and cannot be empty'),
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(200, 'Name must be at most 200 characters')
      .trim(),
    stars: z
      .number()
      .int()
      .min(0, 'Stars cannot be negative')
      .max(5, 'Stars cannot exceed 5')
      .nullable(),
    averageElo: z
      .number()
      .min(0, 'Average ELO cannot be negative')
      .max(5000, 'Average ELO seems unreasonably high')
      .nullable(),
    isFsmRated: z.boolean(),
    startDate: z
      .string()
      .min(1, 'Start date is required')
      .refine(
        (val) => {
          const date = new Date(val);
          return !isNaN(date.getTime());
        },
        { message: 'Start date must be a valid date string' }
      ),
    endDate: z
      .string()
      .nullable()
      .refine(
        (val) => {
          if (val === null) return true;
          const date = new Date(val);
          return !isNaN(date.getTime());
        },
        { message: 'End date must be a valid date string or null' }
      ),
    status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], {
      errorMap: () => ({
        message:
          'Status must be one of: SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED',
      }),
    }),
    participants: z
      .number()
      .int()
      .min(0, 'Participants count cannot be negative'),
  })
  .refine(
    (data) => {
      if (!data.endDate) return true;
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      return endDate >= startDate;
    },
    {
      message: 'End date must be after or equal to start date',
      path: ['endDate'],
    }
  );

export type TournamentRawData = z.infer<typeof tournamentSchema>;
