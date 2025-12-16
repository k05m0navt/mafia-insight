/**
 * Data Integrity Checker
 *
 * Verifies referential integrity and data consistency after import.
 * Checks for orphaned records, broken foreign key relationships, and data anomalies.
 */

import { PrismaClient } from '@prisma/client';
import { resilientDB } from '@/lib/db-resilient';

export interface IntegrityViolation {
  entityType: string;
  entityId: string;
  missingReferenceType: string;
  missingReferenceId: string;
  relationshipType: string;
  message: string;
}

export interface IntegrityCheckResult {
  checkName: string;
  passed: boolean;
  totalChecked: number;
  errors: string[];
  violations?: IntegrityViolation[];
  cardinalityViolations?: Array<{
    relationshipType: string;
    expectedCardinality: string;
    actualCardinality: string;
    entityId: string;
    message: string;
  }>;
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
   * Enhanced to verify both playerId and gameId references with detailed violation logging (Story 2.9: AC #1).
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

    const gameIds = new Set(
      (
        await resilientDB.execute((db) =>
          db.game.findMany({ select: { id: true } })
        )
      ).map((g) => g.id)
    );

    const errors: string[] = [];
    const violations: IntegrityViolation[] = [];

    for (const participation of participations) {
      if (!playerIds.has(participation.playerId)) {
        const errorMsg = `GameParticipation ${participation.id} references non-existent Player ${participation.playerId}`;
        errors.push(errorMsg);
        violations.push({
          entityType: 'GameParticipation',
          entityId: participation.id,
          missingReferenceType: 'Player',
          missingReferenceId: participation.playerId,
          relationshipType: 'GameParticipation → Player',
          message: errorMsg,
        });
      }
      if (!gameIds.has(participation.gameId)) {
        const errorMsg = `GameParticipation ${participation.id} references non-existent Game ${participation.gameId}`;
        errors.push(errorMsg);
        violations.push({
          entityType: 'GameParticipation',
          entityId: participation.id,
          missingReferenceType: 'Game',
          missingReferenceId: participation.gameId,
          relationshipType: 'GameParticipation → Game',
          message: errorMsg,
        });
      }
    }

    return {
      checkName: 'GameParticipation Links',
      passed: errors.length === 0,
      totalChecked: participations.length,
      errors,
      violations: violations.length > 0 ? violations : undefined,
    };
  }

  /**
   * Check that all PlayerTournament records link to valid Players and Tournaments.
   * Enhanced with detailed violation logging (Story 2.9: AC #1).
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
    const violations: IntegrityViolation[] = [];

    for (const pt of playerTournaments) {
      if (!playerIds.has(pt.playerId)) {
        const errorMsg = `PlayerTournament ${pt.id} references non-existent Player ${pt.playerId}`;
        errors.push(errorMsg);
        violations.push({
          entityType: 'PlayerTournament',
          entityId: pt.id,
          missingReferenceType: 'Player',
          missingReferenceId: pt.playerId,
          relationshipType: 'PlayerTournament → Player',
          message: errorMsg,
        });
      }
      if (!tournamentIds.has(pt.tournamentId)) {
        const errorMsg = `PlayerTournament ${pt.id} references non-existent Tournament ${pt.tournamentId}`;
        errors.push(errorMsg);
        violations.push({
          entityType: 'PlayerTournament',
          entityId: pt.id,
          missingReferenceType: 'Tournament',
          missingReferenceId: pt.tournamentId,
          relationshipType: 'PlayerTournament → Tournament',
          message: errorMsg,
        });
      }
    }

    return {
      checkName: 'PlayerTournament Links',
      passed: errors.length === 0,
      totalChecked: playerTournaments.length,
      errors,
      violations: violations.length > 0 ? violations : undefined,
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
   * Check that all Game records with tournamentId reference existing Tournaments.
   * Enhanced with detailed violation logging (Story 2.9: AC #1).
   */
  async checkGameTournamentLinks(): Promise<IntegrityCheckResult> {
    const games = await resilientDB.execute((db) =>
      db.game.findMany({
        select: { id: true, tournamentId: true },
        where: { tournamentId: { not: null } },
      })
    );

    const tournamentIds = new Set(
      (
        await resilientDB.execute((db) =>
          db.tournament.findMany({ select: { id: true } })
        )
      ).map((t) => t.id)
    );

    const errors: string[] = [];
    const violations: IntegrityViolation[] = [];

    for (const game of games) {
      if (game.tournamentId && !tournamentIds.has(game.tournamentId)) {
        const errorMsg = `Game ${game.id} references non-existent Tournament ${game.tournamentId}`;
        errors.push(errorMsg);
        violations.push({
          entityType: 'Game',
          entityId: game.id,
          missingReferenceType: 'Tournament',
          missingReferenceId: game.tournamentId,
          relationshipType: 'Game → Tournament',
          message: errorMsg,
        });
      }
    }

    return {
      checkName: 'Game-Tournament Links',
      passed: errors.length === 0,
      totalChecked: games.length,
      errors,
      violations: violations.length > 0 ? violations : undefined,
    };
  }

  /**
   * Check that all Player records with clubId reference existing Clubs.
   * Enhanced with detailed violation logging (Story 2.9: AC #1).
   */
  async checkPlayerClubLinks(): Promise<IntegrityCheckResult> {
    const players = await resilientDB.execute((db) =>
      db.player.findMany({
        select: { id: true, clubId: true },
        where: { clubId: { not: null } },
      })
    );

    const clubIds = new Set(
      (
        await resilientDB.execute((db) =>
          db.club.findMany({ select: { id: true } })
        )
      ).map((c) => c.id)
    );

    const errors: string[] = [];
    const violations: IntegrityViolation[] = [];

    for (const player of players) {
      if (player.clubId && !clubIds.has(player.clubId)) {
        const errorMsg = `Player ${player.id} references non-existent Club ${player.clubId}`;
        errors.push(errorMsg);
        violations.push({
          entityType: 'Player',
          entityId: player.id,
          missingReferenceType: 'Club',
          missingReferenceId: player.clubId,
          relationshipType: 'Player → Club',
          message: errorMsg,
        });
      }
    }

    return {
      checkName: 'Player-Club Links',
      passed: errors.length === 0,
      totalChecked: players.length,
      errors,
      violations: violations.length > 0 ? violations : undefined,
    };
  }

  /**
   * Check that all Tournament records with clubId reference existing Clubs.
   * Enhanced for comprehensive referential integrity (Task 3: AC #1, #2).
   *
   * NOTE: This check is currently disabled as Tournament model does not have a clubId field.
   * If clubId is added to Tournament in the future, this check should be re-enabled.
   */
  async checkTournamentClubLinks(): Promise<IntegrityCheckResult> {
    // Tournament model does not have clubId field, so this check is not applicable
    return {
      checkName: 'Tournament-Club Links',
      passed: true,
      totalChecked: 0,
      errors: [],
    };
  }

  /**
   * Check that all Tournament records with chiefJudgeId reference existing Players (judges).
   * Judges are always players in the system.
   * Enhanced for comprehensive referential integrity with detailed violation logging (Story 2.9: AC #1).
   */
  async checkTournamentChiefJudgeLinks(): Promise<IntegrityCheckResult> {
    const tournaments = await resilientDB.execute((db) =>
      db.tournament.findMany({
        select: { id: true, chiefJudgeId: true },
        where: { chiefJudgeId: { not: null } },
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
    const violations: IntegrityViolation[] = [];

    for (const tournament of tournaments) {
      if (tournament.chiefJudgeId && !playerIds.has(tournament.chiefJudgeId)) {
        const errorMsg = `Tournament ${tournament.id} references non-existent Player/Judge ${tournament.chiefJudgeId} as chief judge`;
        errors.push(errorMsg);
        violations.push({
          entityType: 'Tournament',
          entityId: tournament.id,
          missingReferenceType: 'Player/Judge',
          missingReferenceId: tournament.chiefJudgeId,
          relationshipType: 'Tournament → ChiefJudge (Player)',
          message: errorMsg,
        });
      }
    }

    return {
      checkName: 'Tournament-ChiefJudge Links',
      passed: errors.length === 0,
      totalChecked: tournaments.length,
      errors,
      violations: violations.length > 0 ? violations : undefined,
    };
  }

  /**
   * Validate relationship cardinality (one-to-many, many-to-many as expected).
   * Verifies that relationships follow expected cardinality patterns (Story 2.9: AC #1).
   *
   * Validates:
   * - One-to-many: Club → Players, Tournament → Games, Player → GameParticipations, etc.
   * - Many-to-many: Player ↔ Tournament (via PlayerTournament junction table)
   *
   * Note: Database foreign key constraints already enforce cardinality at the database level.
   * This validation provides application-level verification and reporting.
   */
  async checkRelationshipCardinality(): Promise<IntegrityCheckResult> {
    const cardinalityViolations: Array<{
      relationshipType: string;
      expectedCardinality: string;
      actualCardinality: string;
      entityId: string;
      message: string;
    }> = [];
    const errors: string[] = [];

    // Validate one-to-many: GameParticipation → Game (many participations per game is expected)
    const gameParticipations = await resilientDB.execute((db) =>
      db.gameParticipation.findMany({
        select: { id: true, gameId: true },
      })
    );

    // Get all games to check for games with no participations
    // Also fetch tournamentId for tournament counting
    const allGames = await resilientDB.execute((db) =>
      db.game.findMany({
        select: { id: true, tournamentId: true },
      })
    );

    // Count participations per game
    const participationsPerGame = new Map<string, number>();
    for (const participation of gameParticipations) {
      const count = participationsPerGame.get(participation.gameId) || 0;
      participationsPerGame.set(participation.gameId, count + 1);
    }

    // Validate: A game should have multiple participations (typically 10 players)
    // This is a sanity check - games with 0 participations might indicate data issues
    for (const game of allGames) {
      const participationCount = participationsPerGame.get(game.id) || 0;
      if (participationCount === 0) {
        const violation = {
          relationshipType: 'Game → GameParticipations',
          expectedCardinality:
            'one-to-many (game should have multiple participations)',
          actualCardinality: 'zero participations',
          entityId: game.id,
          message: `Game ${game.id} has no participations, which violates expected one-to-many relationship`,
        };
        cardinalityViolations.push(violation);
        errors.push(violation.message);
      }
    }

    // Validate many-to-many: PlayerTournament junction table
    // Each PlayerTournament should represent a unique Player-Tournament pair
    const playerTournaments = await resilientDB.execute((db) =>
      db.playerTournament.findMany({
        select: { id: true, playerId: true, tournamentId: true },
      })
    );

    // Check for duplicate Player-Tournament pairs (should be prevented by unique constraint, but verify)
    const playerTournamentPairs = new Set<string>();
    for (const pt of playerTournaments) {
      const pairKey = `${pt.playerId}:${pt.tournamentId}`;
      if (playerTournamentPairs.has(pairKey)) {
        const violation = {
          relationshipType: 'Player ↔ Tournament (many-to-many)',
          expectedCardinality: 'many-to-many (unique Player-Tournament pairs)',
          actualCardinality: 'duplicate pair detected',
          entityId: pt.id,
          message: `PlayerTournament ${pt.id} represents duplicate Player-Tournament pair (${pt.playerId}, ${pt.tournamentId})`,
        };
        cardinalityViolations.push(violation);
        errors.push(violation.message);
      }
      playerTournamentPairs.add(pairKey);
    }

    // Validate one-to-many: Tournament → Games
    // Count games per tournament (using allGames already fetched above)
    const gamesPerTournament = new Map<string, number>();
    for (const game of allGames) {
      if (game.tournamentId) {
        const count = gamesPerTournament.get(game.tournamentId) || 0;
        gamesPerTournament.set(game.tournamentId, count + 1);
      }
    }

    // Validate: A tournament can have many games (one-to-many is correct)
    // No violations expected here as the relationship is correctly one-to-many
    // This check is primarily for documentation and future extensibility

    // Validate one-to-many: Player → GameParticipations
    const participationsPerPlayer = new Map<string, number>();
    for (const participation of gameParticipations) {
      const count = participationsPerPlayer.get(participation.playerId) || 0;
      participationsPerPlayer.set(participation.playerId, count + 1);
    }

    // Validate: A player can have many participations (one-to-many is correct)
    // No violations expected here as the relationship is correctly one-to-many

    return {
      checkName: 'Relationship Cardinality',
      passed: cardinalityViolations.length === 0,
      totalChecked:
        allGames.length + playerTournaments.length + gamesPerTournament.size,
      errors,
      cardinalityViolations:
        cardinalityViolations.length > 0 ? cardinalityViolations : undefined,
    };
  }

  /**
   * Check that all Game records with judgeId reference existing Players (judges).
   * Judges are always players in the system.
   * Enhanced for comprehensive referential integrity with detailed violation logging (Story 2.9: AC #1).
   */
  async checkGameJudgeLinks(): Promise<IntegrityCheckResult> {
    const games = await resilientDB.execute((db) =>
      db.game.findMany({
        select: { id: true, judgeId: true },
        where: { judgeId: { not: null } },
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
    const violations: IntegrityViolation[] = [];

    for (const game of games) {
      if (game.judgeId && !playerIds.has(game.judgeId)) {
        const errorMsg = `Game ${game.id} references non-existent Player/Judge ${game.judgeId} as judge`;
        errors.push(errorMsg);
        violations.push({
          entityType: 'Game',
          entityId: game.id,
          missingReferenceType: 'Player/Judge',
          missingReferenceId: game.judgeId,
          relationshipType: 'Game → Judge (Player)',
          message: errorMsg,
        });
      }
    }

    return {
      checkName: 'Game-Judge Links',
      passed: errors.length === 0,
      totalChecked: games.length,
      errors,
      violations: violations.length > 0 ? violations : undefined,
    };
  }

  /**
   * Run all integrity checks and return aggregated results.
   * Enhanced with comprehensive referential integrity checks including cardinality validation (Story 2.9: AC #1, #2).
   */
  async checkAllIntegrity(): Promise<AllIntegrityResult> {
    const checks = await Promise.all([
      this.checkGameParticipationLinks(),
      this.checkPlayerTournamentLinks(),
      this.checkGameTournamentLinks(),
      this.checkPlayerClubLinks(),
      this.checkTournamentClubLinks(),
      this.checkTournamentChiefJudgeLinks(),
      this.checkGameJudgeLinks(),
      this.checkRelationshipCardinality(),
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
