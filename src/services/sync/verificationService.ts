import { prisma } from '@/lib/db';
import {
  fetchPlayerDetails,
  fetchClubDetails,
  fetchTournamentDetails,
} from '@/lib/gomafia/api';

/**
 * Data Verification Service
 * Implements 1% random sampling strategy for data integrity checks
 */

export interface VerificationResult {
  entityType: 'player' | 'club' | 'tournament';
  totalCount: number;
  sampleSize: number;
  matchedCount: number;
  discrepancies: DiscrepancyDetail[];
  accuracy: number;
}

export interface DiscrepancyDetail {
  id: string;
  type: string;
  field: string;
  expected: unknown;
  actual: unknown;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface OverallVerificationReport {
  timestamp: Date;
  sampleStrategy: string;
  triggerType: 'MANUAL' | 'SCHEDULED';
  results: {
    players: VerificationResult;
    clubs: VerificationResult;
    tournaments: VerificationResult;
  };
  overallAccuracy: number;
  status: 'PASSED' | 'FAILED' | 'WARNING';
}

/**
 * Get 1% random sample of entities
 */
async function getRandomSample<T extends { id: string }>(
  entities: T[],
  percentage: number = 1
): Promise<T[]> {
  const sampleSize = Math.max(
    1,
    Math.ceil(entities.length * (percentage / 100))
  );
  const shuffled = [...entities].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, sampleSize);
}

/**
 * Verify player data accuracy
 */
async function verifyPlayers(): Promise<VerificationResult> {
  try {
    // Get all players from database
    const allPlayers = await prisma.player.findMany({
      select: {
        id: true,
        gomafiaId: true,
        name: true,
        wins: true,
        eloRating: true,
      },
    });

    // Get 1% random sample
    const sample = await getRandomSample(allPlayers);
    const discrepancies: DiscrepancyDetail[] = [];
    let matchedCount = 0;

    // Verify each sampled player against gomafia.pro
    for (const player of sample) {
      try {
        const externalData = await fetchPlayerDetails(player.gomafiaId);

        let hasDiscrepancy = false;

        // Check name
        if (externalData.name !== player.name) {
          discrepancies.push({
            id: player.id,
            type: 'player',
            field: 'name',
            expected: externalData.name,
            actual: player.name,
            severity: 'MEDIUM',
          });
          hasDiscrepancy = true;
        }

        // Check wins
        if (externalData.wins !== player.wins) {
          discrepancies.push({
            id: player.id,
            type: 'player',
            field: 'wins',
            expected: externalData.wins,
            actual: player.wins,
            severity: 'LOW',
          });
          hasDiscrepancy = true;
        }

        // Check rating (eloRating)
        if (
          externalData.rating &&
          Math.abs(externalData.rating - player.eloRating) > 1
        ) {
          discrepancies.push({
            id: player.id,
            type: 'player',
            field: 'eloRating',
            expected: externalData.rating,
            actual: player.eloRating,
            severity: 'MEDIUM',
          });
          hasDiscrepancy = true;
        }

        if (!hasDiscrepancy) {
          matchedCount++;
        }
      } catch (error) {
        console.error(`Failed to verify player ${player.id}:`, error);
        // Don't count as discrepancy if external fetch fails
      }
    }

    const accuracy =
      sample.length > 0 ? (matchedCount / sample.length) * 100 : 100;

    return {
      entityType: 'player',
      totalCount: allPlayers.length,
      sampleSize: sample.length,
      matchedCount,
      discrepancies,
      accuracy,
    };
  } catch (error) {
    console.error('Player verification failed:', error);
    throw error;
  }
}

/**
 * Verify club data accuracy
 */
async function verifyClubs(): Promise<VerificationResult> {
  try {
    const allClubs = await prisma.club.findMany({
      select: {
        id: true,
        gomafiaId: true,
        name: true,
        region: true,
      },
    });

    const sample = await getRandomSample(allClubs);
    const discrepancies: DiscrepancyDetail[] = [];
    let matchedCount = 0;

    for (const club of sample) {
      try {
        if (!club.gomafiaId) continue; // Skip clubs without gomafiaId
        const externalData = await fetchClubDetails(club.gomafiaId);

        let hasDiscrepancy = false;

        if (externalData.name !== club.name) {
          discrepancies.push({
            id: club.id,
            type: 'club',
            field: 'name',
            expected: externalData.name,
            actual: club.name,
            severity: 'MEDIUM',
          });
          hasDiscrepancy = true;
        }

        if (externalData.city && externalData.city !== club.region) {
          discrepancies.push({
            id: club.id,
            type: 'club',
            field: 'region',
            expected: externalData.city,
            actual: club.region,
            severity: 'LOW',
          });
          hasDiscrepancy = true;
        }

        if (!hasDiscrepancy) {
          matchedCount++;
        }
      } catch (error) {
        console.error(`Failed to verify club ${club.id}:`, error);
      }
    }

    const accuracy =
      sample.length > 0 ? (matchedCount / sample.length) * 100 : 100;

    return {
      entityType: 'club',
      totalCount: allClubs.length,
      sampleSize: sample.length,
      matchedCount,
      discrepancies,
      accuracy,
    };
  } catch (error) {
    console.error('Club verification failed:', error);
    throw error;
  }
}

/**
 * Verify tournament data accuracy
 */
async function verifyTournaments(): Promise<VerificationResult> {
  try {
    const allTournaments = await prisma.tournament.findMany({
      select: {
        id: true,
        gomafiaId: true,
        name: true,
        startDate: true,
      },
      where: {
        startDate: {
          gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Last year only
        },
      },
    });

    const sample = await getRandomSample(allTournaments);
    const discrepancies: DiscrepancyDetail[] = [];
    let matchedCount = 0;

    for (const tournament of sample) {
      try {
        if (!tournament.gomafiaId) continue; // Skip tournaments without gomafiaId
        const externalData = await fetchTournamentDetails(tournament.gomafiaId);

        let hasDiscrepancy = false;

        if (externalData.name !== tournament.name) {
          discrepancies.push({
            id: tournament.id,
            type: 'tournament',
            field: 'name',
            expected: externalData.name,
            actual: tournament.name,
            severity: 'MEDIUM',
          });
          hasDiscrepancy = true;
        }

        if (!hasDiscrepancy) {
          matchedCount++;
        }
      } catch (error) {
        console.error(`Failed to verify tournament ${tournament.id}:`, error);
      }
    }

    const accuracy =
      sample.length > 0 ? (matchedCount / sample.length) * 100 : 100;

    return {
      entityType: 'tournament',
      totalCount: allTournaments.length,
      sampleSize: sample.length,
      matchedCount,
      discrepancies,
      accuracy,
    };
  } catch (error) {
    console.error('Tournament verification failed:', error);
    throw error;
  }
}

/**
 * Run complete data verification check
 */
export async function runDataVerification(
  triggerType: 'MANUAL' | 'SCHEDULED' = 'MANUAL'
): Promise<OverallVerificationReport> {
  const timestamp = new Date();

  console.log('[Verification] Starting data integrity check...');

  try {
    // Run all verification checks in parallel
    const [playerResults, clubResults, tournamentResults] = await Promise.all([
      verifyPlayers(),
      verifyClubs(),
      verifyTournaments(),
    ]);

    // Calculate overall accuracy
    const totalSample =
      playerResults.sampleSize +
      clubResults.sampleSize +
      tournamentResults.sampleSize;
    const totalMatched =
      playerResults.matchedCount +
      clubResults.matchedCount +
      tournamentResults.matchedCount;
    const overallAccuracy =
      totalSample > 0 ? (totalMatched / totalSample) * 100 : 100;

    // Determine status
    let status: 'PASSED' | 'FAILED' | 'WARNING';
    if (overallAccuracy >= 95) {
      status = 'PASSED';
    } else if (overallAccuracy >= 85) {
      status = 'WARNING';
    } else {
      status = 'FAILED';
    }

    const report: OverallVerificationReport = {
      timestamp,
      sampleStrategy: '1_percent',
      triggerType,
      results: {
        players: playerResults,
        clubs: clubResults,
        tournaments: tournamentResults,
      },
      overallAccuracy,
      status,
    };

    // Save report to database
    await prisma.dataIntegrityReport.create({
      data: {
        timestamp,
        overallAccuracy,
        entities: {
          players: {
            total: playerResults.totalCount,
            sampled: playerResults.sampleSize,
            matched: playerResults.matchedCount,
            accuracy: playerResults.accuracy,
          },
          clubs: {
            total: clubResults.totalCount,
            sampled: clubResults.sampleSize,
            matched: clubResults.matchedCount,
            accuracy: clubResults.accuracy,
          },
          tournaments: {
            total: tournamentResults.totalCount,
            sampled: tournamentResults.sampleSize,
            matched: tournamentResults.matchedCount,
            accuracy: tournamentResults.accuracy,
          },
        },
        discrepancies: {
          players: JSON.parse(JSON.stringify(playerResults.discrepancies)),
          clubs: JSON.parse(JSON.stringify(clubResults.discrepancies)),
          tournaments: JSON.parse(
            JSON.stringify(tournamentResults.discrepancies)
          ),
        },
        sampleStrategy: '1_percent',
        triggerType,
        status,
        completedAt: new Date(),
      },
    });

    console.log(
      `[Verification] Complete. Overall accuracy: ${overallAccuracy.toFixed(2)}%`
    );

    return report;
  } catch (error) {
    console.error('[Verification] Failed:', error);
    throw error;
  }
}

/**
 * Get latest verification report
 */
export async function getLatestVerificationReport() {
  return prisma.dataIntegrityReport.findFirst({
    orderBy: { timestamp: 'desc' },
  });
}

/**
 * Get verification history
 */
export async function getVerificationHistory(limit: number = 10) {
  return prisma.dataIntegrityReport.findMany({
    orderBy: { timestamp: 'desc' },
    take: limit,
  });
}
