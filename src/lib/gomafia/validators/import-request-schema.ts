import { z } from 'zod';

/**
 * Zod schema for validating historical import request.
 * Accepts either a gomafia.pro profile URL or a player ID.
 */
export const historicalImportRequestSchema = z
  .object({
    profileUrl: z
      .string()
      .url('Invalid URL format')
      .refine(
        (url) => {
          try {
            const parsedUrl = new URL(url);
            return (
              parsedUrl.hostname === 'gomafia.pro' &&
              (parsedUrl.pathname.startsWith('/stats/') ||
                parsedUrl.pathname.startsWith('/player/'))
            );
          } catch {
            return false;
          }
        },
        {
          message:
            'URL must be a valid gomafia.pro profile URL (e.g., https://gomafia.pro/stats/{id} or https://gomafia.pro/player/{id})',
        }
      )
      .optional(),
    playerId: z
      .string()
      .min(1, 'Player ID cannot be empty')
      .regex(/^\d+$/, 'Player ID must be numeric')
      .optional(),
    order: z
      .enum(['oldest-first', 'newest-first'])
      .default('newest-first')
      .optional(),
  })
  .refine((data) => data.profileUrl || data.playerId, {
    message: 'Either profileUrl or playerId must be provided',
    path: ['profileUrl'], // Error will be shown on profileUrl field
  });

export type HistoricalImportRequest = z.infer<
  typeof historicalImportRequestSchema
>;

/**
 * Extract player ID from a gomafia.pro profile URL.
 * @param url The profile URL
 * @returns The player ID or null if invalid
 */
export function extractPlayerIdFromUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url);

    // Must be gomafia.pro domain
    if (parsedUrl.hostname !== 'gomafia.pro') {
      return null;
    }

    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);

    if (pathParts[0] === 'stats' || pathParts[0] === 'player') {
      return pathParts[1] || null;
    }

    return null;
  } catch {
    return null;
  }
}
