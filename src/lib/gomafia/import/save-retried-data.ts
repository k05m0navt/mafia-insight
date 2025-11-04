/**
 * Utility functions to save retried data from skipped pages.
 * This is used when manually retrying skipped pages via the admin API.
 */

import { resilientDB } from '@/lib/db-resilient';
import {
  PlayerRawData,
  playerSchema,
} from '@/lib/gomafia/validators/player-schema';
import { ClubRawData, clubSchema } from '@/lib/gomafia/validators/club-schema';
import {
  TournamentRawData,
  tournamentSchema,
} from '@/lib/gomafia/validators/tournament-schema';
import { normalizeRegion } from '@/lib/gomafia/parsers/region-normalizer';
import { parseGomafiaDate } from '@/lib/gomafia/parsers/date-parser';

/**
 * Get or create system user for imports.
 */
async function getSystemUser(): Promise<string> {
  // Try to find existing system user
  let systemUser = await resilientDB.execute((db) =>
    db.user.findFirst({
      where: { email: 'system@mafia-insight.com' },
    })
  );

  if (!systemUser) {
    // Create system user if it doesn't exist
    systemUser = await resilientDB.execute((db) =>
      db.user.create({
        data: {
          email: 'system@mafia-insight.com',
          name: 'System',
          role: 'admin',
        },
      })
    );
  }

  return systemUser.id;
}

/**
 * Save retried player data to database.
 */
export async function saveRetriedPlayers(
  players: PlayerRawData[]
): Promise<{ saved: number; skipped: number; errors: number }> {
  let saved = 0;
  let skipped = 0;
  let errors = 0;

  try {
    const systemUserId = await getSystemUser();
    const validPlayers: PlayerRawData[] = [];

    // Validate players
    for (const player of players) {
      const result = playerSchema.safeParse(player);
      if (!result.success) {
        errors++;
        continue;
      }

      // Check if already exists
      const exists = await resilientDB.execute((db) =>
        db.player.findUnique({
          where: { gomafiaId: player.gomafiaId },
        })
      );

      if (exists) {
        skipped++;
        continue;
      }

      validPlayers.push(player);
    }

    if (validPlayers.length === 0) {
      return { saved: 0, skipped, errors };
    }

    // Transform to Prisma format
    const playersToInsert = await Promise.all(
      validPlayers.map(async (player) => {
        // Find club by name if provided
        let clubId: string | undefined;
        if (player.club) {
          const club = await resilientDB.execute((db) =>
            db.club.findFirst({
              where: { name: player.club || undefined },
            })
          );
          clubId = (club as { id: string } | null)?.id;
        }

        return {
          gomafiaId: player.gomafiaId,
          name: player.name,
          region: normalizeRegion(player.region),
          clubId,
          eloRating: Math.round(player.elo),
          totalGames: player.tournaments,
          wins: 0,
          losses: 0,
          userId: systemUserId,
          lastSyncAt: new Date(),
          syncStatus: 'SYNCED' as const,
        };
      })
    );

    // Insert batch
    await resilientDB.execute((db) =>
      db.player.createMany({
        data: playersToInsert,
        skipDuplicates: true,
      })
    );

    saved = validPlayers.length;
  } catch (error) {
    console.error('[saveRetriedPlayers] Error saving players:', error);
    throw error;
  }

  return { saved, skipped, errors };
}

/**
 * Save retried club data to database.
 */
export async function saveRetriedClubs(
  clubs: ClubRawData[]
): Promise<{ saved: number; skipped: number; errors: number }> {
  let saved = 0;
  let skipped = 0;
  let errors = 0;

  try {
    const systemUserId = await getSystemUser();
    const validClubs: ClubRawData[] = [];

    // Validate clubs
    for (const club of clubs) {
      const result = clubSchema.safeParse(club);
      if (!result.success) {
        errors++;
        continue;
      }

      // Check if already exists
      const exists = await resilientDB.execute((db) =>
        db.club.findUnique({
          where: { gomafiaId: club.gomafiaId },
        })
      );

      if (exists) {
        skipped++;
        continue;
      }

      validClubs.push(club);
    }

    if (validClubs.length === 0) {
      return { saved: 0, skipped, errors };
    }

    // Transform to Prisma format
    const clubsToInsert = validClubs.map((club) => ({
      gomafiaId: club.gomafiaId,
      name: club.name,
      region: normalizeRegion(club.region),
      createdBy: systemUserId,
      lastSyncAt: new Date(),
      syncStatus: 'SYNCED' as const,
    }));

    // Insert batch
    await resilientDB.execute((db) =>
      db.club.createMany({
        data: clubsToInsert,
        skipDuplicates: true,
      })
    );

    saved = validClubs.length;
  } catch (error) {
    console.error('[saveRetriedClubs] Error saving clubs:', error);
    throw error;
  }

  return { saved, skipped, errors };
}

/**
 * Save retried tournament data to database.
 */
export async function saveRetriedTournaments(
  tournaments: TournamentRawData[]
): Promise<{ saved: number; skipped: number; errors: number }> {
  let saved = 0;
  let skipped = 0;
  let errors = 0;

  try {
    const systemUserId = await getSystemUser();
    const validTournaments: TournamentRawData[] = [];

    // Validate tournaments
    for (const tournament of tournaments) {
      const result = tournamentSchema.safeParse(tournament);
      if (!result.success) {
        errors++;
        continue;
      }

      // Check if already exists
      const exists = await resilientDB.execute((db) =>
        db.tournament.findUnique({
          where: { gomafiaId: tournament.gomafiaId },
        })
      );

      if (exists) {
        skipped++;
        continue;
      }

      validTournaments.push(tournament);
    }

    if (validTournaments.length === 0) {
      return { saved: 0, skipped, errors };
    }

    // Transform to Prisma format
    const tournamentsToInsert = validTournaments.map((tournament) => ({
      gomafiaId: tournament.gomafiaId,
      name: tournament.name,
      stars: tournament.stars,
      averageElo: tournament.averageElo,
      isFsmRated: tournament.isFsmRated,
      startDate: parseGomafiaDate(tournament.startDate),
      endDate: tournament.endDate ? parseGomafiaDate(tournament.endDate) : null,
      status: tournament.status,
      createdBy: systemUserId,
      lastSyncAt: new Date(),
      syncStatus: 'SYNCED' as const,
    }));

    // Insert batch
    await resilientDB.execute((db) =>
      db.tournament.createMany({
        data: tournamentsToInsert,
        skipDuplicates: true,
      })
    );

    saved = validTournaments.length;
  } catch (error) {
    console.error('[saveRetriedTournaments] Error saving tournaments:', error);
    throw error;
  }

  return { saved, skipped, errors };
}
