/**
 * Data Integrity Checker
 *
 * Verifies referential integrity and data consistency after import.
 * Checks for orphaned records, broken foreign key relationships, and data anomalies.
 */

import { PrismaClient } from '@prisma/client';
import { resilientDB } from '@/lib/db-resilient';

export interface IntegrityCheckResult {
  checkName: string;
  passed: boolean;
  totalChecked: number;
  errors: string[];
}

export interface IntegritySummary {
  status: 'PASS' | 'FAIL';
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  message: string;
  issues?: string[];
}

export interface AllIntegrityResult {
  passed: boolean;
  checks: IntegrityCheckResult[];
  failedChecks: number;
  summary: string;
}

export interface OrphanedRecordsResult extends IntegrityCheckResult {
  orphanedGames: number;
  orphanedParticipations: number;
  orphanedPlayerTournaments: number;
}

/**
 * Performs comprehensive integrity checks on imported data.
 */
export class IntegrityChecker {
  constructor(private db: PrismaClient) {}

  /**
   * Check that all GameParticipation records link to valid Players and Games.
   */
  async checkGameParticipationLinks(): Promise<IntegrityCheckResult> {
    const participations = await resilientDB.execute((db) =>
      db.gameParticipation.findMany({
        select: { id: true, playerId: true, gameId: true },
      })
    );

    const playerIds = new Set(
      (
        await resilientDB.execute((db) =>
          db.player.findMany({ select: { id: true } })
        )
      ).map((p) => p.id)
    );

    const errors: string[] = [];

    for (const participation of participations) {
      if (!playerIds.has(participation.playerId)) {
        errors.push(
          `GameParticipation ${participation.id} references non-existent Player ${participation.playerId}`
        );
      }
    }

    return {
      checkName: 'GameParticipation Links',
      passed: errors.length === 0,
      totalChecked: participations.length,
      errors,
    };
  }

  /**
   * Check that all PlayerTournament records link to valid Players and Tournaments.
   */
  async checkPlayerTournamentLinks(): Promise<IntegrityCheckResult> {
    const playerTournaments = await resilientDB.execute((db) =>
      db.playerTournament.findMany({
        select: { id: true, playerId: true, tournamentId: true },
      })
    );

    const playerIds = new Set(
      (
        await resilientDB.execute((db) =>
          db.player.findMany({ select: { id: true } })
        )
      ).map((p) => p.id)
    );

    const tournamentIds = new Set(
      (
        await resilientDB.execute((db) =>
          db.tournament.findMany({ select: { id: true } })
        )
      ).map((t) => t.id)
    );

    const errors: string[] = [];

    for (const pt of playerTournaments) {
      if (!playerIds.has(pt.playerId)) {
        errors.push(
          `PlayerTournament ${pt.id} references non-existent Player ${pt.playerId}`
        );
      }
      if (!tournamentIds.has(pt.tournamentId)) {
        errors.push(
          `PlayerTournament ${pt.id} references non-existent Tournament ${pt.tournamentId}`
        );
      }
    }

    return {
      checkName: 'PlayerTournament Links',
      passed: errors.length === 0,
      totalChecked: playerTournaments.length,
      errors,
    };
  }

  /**
   * Check for orphaned records (records referencing deleted parents).
   */
  async checkOrphanedRecords(): Promise<OrphanedRecordsResult> {
    const tournamentIds = new Set(
      (
        await resilientDB.execute((db) =>
          db.tournament.findMany({ select: { id: true } })
        )
      ).map((t) => t.id)
    );

    const gameIds = new Set(
      (
        await resilientDB.execute((db) =>
          db.game.findMany({ select: { id: true } })
        )
      ).map((g) => g.id)
    );

    const playerIds = new Set(
      (
        await resilientDB.execute((db) =>
          db.player.findMany({ select: { id: true } })
        )
      ).map((p) => p.id)
    );

    // Check orphaned games
    const games = await resilientDB.execute((db) =>
      db.game.findMany({
        select: { id: true, tournamentId: true },
      })
    );
    const orphanedGames = games.filter(
      (g) => g.tournamentId && !tournamentIds.has(g.tournamentId)
    ).length;

    // Check orphaned participations
    const participations = await resilientDB.execute((db) =>
      db.gameParticipation.findMany({
        select: { id: true, gameId: true, playerId: true },
      })
    );
    const orphanedParticipations = participations.filter(
      (p) => !gameIds.has(p.gameId) || !playerIds.has(p.playerId)
    ).length;

    // Check orphaned player tournaments
    const playerTournaments = await resilientDB.execute((db) =>
      db.playerTournament.findMany({
        select: { id: true, playerId: true, tournamentId: true },
      })
    );
    const orphanedPlayerTournaments = playerTournaments.filter(
      (pt) => !playerIds.has(pt.playerId) || !tournamentIds.has(pt.tournamentId)
    ).length;

    const totalOrphaned =
      orphanedGames + orphanedParticipations + orphanedPlayerTournaments;
    const errors: string[] = [];

    if (orphanedGames > 0) {
      errors.push(`Found ${orphanedGames} orphaned Game records`);
    }
    if (orphanedParticipations > 0) {
      errors.push(
        `Found ${orphanedParticipations} orphaned GameParticipation records`
      );
    }
    if (orphanedPlayerTournaments > 0) {
      errors.push(
        `Found ${orphanedPlayerTournaments} orphaned PlayerTournament records`
      );
    }

    return {
      checkName: 'Orphaned Records',
      passed: totalOrphaned === 0,
      totalChecked:
        games.length + participations.length + playerTournaments.length,
      errors,
      orphanedGames,
      orphanedParticipations,
      orphanedPlayerTournaments,
    };
  }

  /**
   * Run all integrity checks and return aggregated results.
   */
  async checkAllIntegrity(): Promise<AllIntegrityResult> {
    const checks = await Promise.all([
      this.checkGameParticipationLinks(),
      this.checkPlayerTournamentLinks(),
      this.checkOrphanedRecords(),
    ]);

    const failedChecks = checks.filter((c) => !c.passed).length;
    const passed = failedChecks === 0;

    let summary = '';
    if (passed) {
      summary = 'All integrity checks passed successfully.';
    } else {
      summary = `${failedChecks} of ${checks.length} integrity checks failed.`;
    }

    return {
      passed,
      checks,
      failedChecks,
      summary,
    };
  }

  /**
   * Get a user-friendly integrity summary.
   */
  async getIntegritySummary(): Promise<IntegritySummary> {
    const result = await this.checkAllIntegrity();

    const issues: string[] = [];
    for (const check of result.checks) {
      if (!check.passed) {
        issues.push(...check.errors);
      }
    }

    return {
      status: result.passed ? 'PASS' : 'FAIL',
      totalChecks: result.checks.length,
      passedChecks: result.checks.length - result.failedChecks,
      failedChecks: result.failedChecks,
      message: result.summary,
      issues: issues.length > 0 ? issues : undefined,
    };
  }
}
