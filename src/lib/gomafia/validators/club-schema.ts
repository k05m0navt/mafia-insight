import { z } from 'zod';

/**
 * Zod schema for validating raw club data scraped from gomafia.pro
 */
export const clubSchema = z.object({
  gomafiaId: z.string().min(1, 'Gomafia ID is required'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  region: z.string().nullable(),
  president: z.string().nullable(),
  members: z.number().int().min(0, 'Members count cannot be negative'),
});

export type ClubRawData = z.infer<typeof clubSchema>;
