import { ImportOrchestrator } from '../import-orchestrator';
import { ImportCheckpoint } from '../checkpoint-manager';
import { resilientDB } from '@/lib/db-resilient';
import { TournamentGamesScraper } from '../../scrapers/tournament-games-scraper';
import { gameSchema, GameRawData } from '../../validators/game-schema';
import { PlayerRole, Team, FirstShootType } from '@prisma/client';
import { importOrchestrator } from '../orchestrator';
import { Page } from 'playwright';

/**
 * Phase 6: Import games and game participations
 *
 * For each tournament, imports all games with their participations.
 * Games are ordered newest-first (descending chronological).
 */
export class GamesPhase {
  private tournamentGamesScraper: TournamentGamesScraper | null = null;
  private static readonly PARALLEL_CONCURRENCY = parseInt(
    process.env.GAMES_PARALLEL_CONCURRENCY || '3'
  ); // Number of parallel browser pages (conservative default to avoid overwhelming server)

  constructor(private orchestrator: ImportOrchestrator) {}

  /**
   * Initialize scraper with browser page.
   * NOTE: With parallel processing, this is now only used for compatibility.
   * Each parallel task creates its own page and scraper.
   */
  private async initializeScraper(): Promise<void> {
    if (this.tournamentGamesScraper) return;

    const browser = this.orchestrator.getBrowser();
    const page = await browser.newPage();

    // PERFORMANCE: Block unnecessary resources to reduce page load time by 40-60%
    await page.route('**/*', (route) => {
      const resourceType = route.request().resourceType();
      const url = route.request().url();
      // Block images, fonts, media, stylesheets, and analytics
      if (
        ['image', 'font', 'media', 'stylesheet'].includes(resourceType) ||
        url.includes('analytics') ||
        url.includes('google-analytics') ||
        url.includes('gtag')
      ) {
        route.abort();
      } else {
        route.continue();
      }
    });

    // TournamentGamesScraper creates its own RetryManager if none provided
    this.tournamentGamesScraper = new TournamentGamesScraper(page);
  }

  /**
   * Get phase name.
   */
  getPhaseName(): 'GAMES' {
    return 'GAMES';
  }

  /**
   * Execute the games import phase.
   */
  async execute(): Promise<void> {
    console.log('[GamesPhase] Starting games import...');

    // Check for cancellation before starting
    this.orchestrator.checkCancellation();

    // Initialize scraper
    await this.initializeScraper();
    if (!this.tournamentGamesScraper) {
      throw new Error('Failed to initialize tournament games scraper');
    }

    // Get all tournaments
    const tournaments = (await resilientDB.execute((db) =>
      db.tournament.findMany({
        select: { id: true, gomafiaId: true, name: true },
      })
    )) as Array<{ id: string; gomafiaId: string; name: string }>;

    console.log(
      `[GamesPhase] Found ${tournaments.length} tournaments to process`
    );

    let totalGames = 0;
    let totalParticipations = 0;
    let errorCount = 0;
    let processedTournaments = 0;

    // Calculate phase progress range (GAMES is phase 6 out of 7)
    const phaseIndex = 5; // 0-based index for GAMES phase
    const totalPhases = 7;
    const phaseStartProgress = Math.floor((phaseIndex / totalPhases) * 100);
    const phaseEndProgress = Math.floor(((phaseIndex + 1) / totalPhases) * 100);
    const phaseProgressRange = phaseEndProgress - phaseStartProgress;

    // Initialize record tracking for games phase (tournaments = records)
    await resilientDB.execute((db) =>
      db.syncStatus.update({
        where: { id: 'current' },
        data: {
          totalRecordsProcessed: tournaments.length,
          validRecords: 0,
          invalidRecords: 0,
          updatedAt: new Date(),
        },
      })
    );

    // Also immediately update importProgress if we can find the active import
    // This ensures the UI shows correct total count from the start
    try {
      const activeImport = await resilientDB.execute((db) =>
        db.importProgress.findFirst({
          where: {
            operation: 'games',
            status: 'RUNNING',
          },
          orderBy: {
            startTime: 'desc',
          },
        })
      );

      if (activeImport) {
        await resilientDB.execute((db) =>
          db.importProgress.update({
            where: { id: activeImport.id },
            data: {
              totalRecords: tournaments.length,
              updatedAt: new Date(),
            },
          })
        );

        // Also update in-memory if it exists
        const memProgress = importOrchestrator.getImport(activeImport.id);
        if (memProgress) {
          memProgress.totalRecords = tournaments.length;
          // Trigger notification to update terminal output
          await importOrchestrator.updateProgress(
            activeImport.id,
            0,
            0,
            tournaments.length
          );
        }
      }
    } catch (error) {
      // Silently fail - progress polling will pick it up
      console.warn(
        '[GamesPhase] Could not update importProgress immediately:',
        error
      );
    }

    // Buffer to collect games and participations for batch saving
    interface BufferedGame {
      gameData: GameRawData;
      tournamentId: string;
    }

    // Buffer to collect tournament game count updates for batch saving
    interface TournamentGameCount {
      tournamentId: string;
      gameCount: number;
    }

    const gamesBuffer: BufferedGame[] = [];
    const tournamentGameCountsBuffer: TournamentGameCount[] = [];
    const SAVE_BATCH_SIZE = 10; // Save every 10 tournaments

    // Helper function to save buffered games
    const saveBufferedGames = async (
      gamesToSave: BufferedGame[]
    ): Promise<void> => {
      if (gamesToSave.length === 0) return;

      // Get all unique player names and IDs first for efficient lookup
      const playerNames = new Set<string>();
      const playerIds = new Set<string>();

      for (const buffered of gamesToSave) {
        if (buffered.gameData.participations) {
          for (const part of buffered.gameData.participations) {
            if (part.playerName) playerNames.add(part.playerName);
            if (part.playerId && part.playerId !== '')
              playerIds.add(part.playerId);
          }
        }
      }

      // Batch fetch all players we need
      const playersByName = new Map<string, string>(); // name -> id
      const playersById = new Map<string, string>(); // gomafiaId -> id

      if (playerIds.size > 0) {
        const playersByGomafiaId = (await resilientDB.execute((db) =>
          db.player.findMany({
            where: { gomafiaId: { in: Array.from(playerIds) } },
            select: { id: true, gomafiaId: true },
          })
        )) as Array<{ id: string; gomafiaId: string }>;

        for (const p of playersByGomafiaId) {
          playersById.set(p.gomafiaId, p.id);
        }
      }

      if (playerNames.size > 0) {
        const playersByNameResult = (await resilientDB.execute((db) =>
          db.player.findMany({
            where: { name: { in: Array.from(playerNames) } },
            select: { id: true, name: true },
          })
        )) as Array<{ id: string; name: string }>;

        for (const p of playersByNameResult) {
          playersByName.set(p.name, p.id);
        }
      }

      // Process each game in the buffer
      for (const buffered of gamesToSave) {
        const { gameData, tournamentId } = buffered;

        try {
          // Validate game data
          const isValid = await this.validateData(gameData);
          if (!isValid) {
            console.error(
              `[GamesPhase] Invalid game data for ${gameData.gomafiaId}`
            );
            errorCount++;
            continue;
          }

          // Check if game already exists
          const isDuplicate = await this.checkDuplicate(gameData.gomafiaId);
          if (isDuplicate) {
            console.log(
              `[GamesPhase] Skipping duplicate game: ${gameData.gomafiaId}`
            );
            continue;
          }

          // Insert game
          const game = await resilientDB.execute((db) =>
            db.game.create({
              data: {
                gomafiaId: gameData.gomafiaId,
                tournamentId: tournamentId,
                tableNumber: gameData.tableNumber,
                judgeId: gameData.judgeId,
                date: new Date(gameData.date),
                durationMinutes: gameData.durationMinutes,
                winnerTeam: gameData.winnerTeam,
                status: gameData.status,
                lastSyncAt: new Date(),
                syncStatus: 'SYNCED',
              },
            })
          );

          totalGames++;

          // Insert participations if available
          if (gameData.participations && gameData.participations.length > 0) {
            const participationsWithPlayerIds: Array<{
              playerId: string;
              gameId: string;
              role: PlayerRole;
              team: Team;
              isWinner: boolean;
              performanceScore: number | null;
              eloChange: number | null;
              isFirstShoot: boolean;
              firstShootType: FirstShootType | null;
            }> = [];

            for (const participation of gameData.participations) {
              // Skip participations without role or team (they're required in DB)
              if (!participation.role || !participation.team) {
                console.warn(
                  `[GamesPhase] Skipping participation without role/team for player: ${participation.playerName}`
                );
                continue;
              }

              // Find player using cached lookups
              let playerId: string | null = null;

              if (participation.playerId && participation.playerId !== '') {
                playerId = playersById.get(participation.playerId) || null;
              }

              if (!playerId && participation.playerName) {
                playerId = playersByName.get(participation.playerName) || null;
              }

              if (playerId) {
                participationsWithPlayerIds.push({
                  playerId: playerId,
                  gameId: (game as { id: string }).id,
                  role: participation.role as PlayerRole,
                  team: participation.team as Team,
                  isWinner: participation.isWinner,
                  performanceScore: participation.performanceScore,
                  eloChange: participation.eloChange ?? null,
                  isFirstShoot: participation.isFirstShoot ?? false,
                  firstShootType: participation.firstShootType ?? 'NONE',
                });
              } else {
                console.warn(
                  `[GamesPhase] Player not found for gomafiaId: ${participation.playerId}, name: ${participation.playerName}`
                );
              }
            }

            if (participationsWithPlayerIds.length > 0) {
              await resilientDB.execute((db) =>
                db.gameParticipation.createMany({
                  data: participationsWithPlayerIds,
                  skipDuplicates: true,
                })
              );
              totalParticipations += participationsWithPlayerIds.length;
            }
          }

          // Update metrics
          this.orchestrator.recordValidRecord('Game');
        } catch (error) {
          console.error(
            `[GamesPhase] Failed to insert game ${gameData.gomafiaId}:`,
            error
          );
          errorCount++;
          this.orchestrator.recordInvalidRecord(
            'Game',
            `Failed to insert: ${error instanceof Error ? error.message : 'Unknown error'}`,
            { gomafiaId: gameData.gomafiaId }
          );
        }
      }
    };

    // Helper function to batch update tournament game counts
    const updateTournamentGameCounts = async (
      countsToUpdate: TournamentGameCount[]
    ): Promise<void> => {
      if (countsToUpdate.length === 0) return;

      // Use Promise.all with individual updates since Prisma doesn't support updateMany with different values
      // But we can batch them efficiently
      const now = new Date();

      try {
        await resilientDB.execute(async (db) => {
          // Update all tournaments in a single transaction for better performance
          await Promise.all(
            countsToUpdate.map(({ tournamentId, gameCount }) =>
              db.tournament.update({
                where: { id: tournamentId },
                data: {
                  lastSyncAt: now,
                  gameCount: gameCount,
                },
              })
            )
          );
        });
      } catch (error) {
        // Log error but don't fail - individual updates will be retried
        console.error(
          `[GamesPhase] Failed to batch update tournament game counts:`,
          error
        );
        // Fallback: try individual updates
        for (const { tournamentId, gameCount } of countsToUpdate) {
          try {
            await resilientDB.execute((db) =>
              db.tournament.update({
                where: { id: tournamentId },
                data: {
                  lastSyncAt: new Date(),
                  gameCount: gameCount,
                },
              })
            );
          } catch (individualError) {
            console.error(
              `[GamesPhase] Failed to update tournament ${tournamentId} game count:`,
              individualError
            );
          }
        }
      }
    };

    // Process tournaments in batches
    const batchProcessor = this.orchestrator.getBatchProcessor();
    const rateLimiter = this.orchestrator.getRateLimiter();

    await batchProcessor.process(
      tournaments,
      async (batch, batchIndex, totalBatches) => {
        // Check for cancellation before processing batch
        this.orchestrator.checkCancellation();

        // PERFORMANCE: Process tournaments in parallel using multiple pages
        const chunkSize = GamesPhase.PARALLEL_CONCURRENCY;

        for (let i = 0; i < batch.length; i += chunkSize) {
          // Check for cancellation before processing next chunk
          this.orchestrator.checkCancellation();

          const chunk = (
            batch as Array<{
              id: string;
              gomafiaId: string;
              name: string;
            }>
          ).slice(i, i + chunkSize);

          // Process chunk in parallel
          const chunkResults = await Promise.all(
            chunk.map(async (tournament) => {
              // Skip tournaments without gomafiaId
              if (!tournament.gomafiaId) {
                return {
                  tournament,
                  scrapedGames: [],
                  success: true,
                };
              }

              let page: Page | null = null;
              try {
                // Apply rate limiting before scraping
                await rateLimiter.wait();

                // Create a new scraper instance for this parallel execution
                const browser = this.orchestrator.getBrowser();
                page = await browser.newPage();

                // PERFORMANCE: Block unnecessary resources to reduce page load time
                await page.route('**/*', (route) => {
                  const resourceType = route.request().resourceType();
                  const url = route.request().url();
                  if (
                    ['image', 'font', 'media', 'stylesheet'].includes(
                      resourceType
                    ) ||
                    url.includes('analytics') ||
                    url.includes('google-analytics') ||
                    url.includes('gtag')
                  ) {
                    route.abort();
                  } else {
                    route.continue();
                  }
                });

                // Create scraper for this page
                const scraper = new TournamentGamesScraper(page);

                console.log(
                  `[GamesPhase] Scraping games for tournament: ${tournament.name} (gomafiaId: ${tournament.gomafiaId})`
                );

                // Scrape games for this tournament
                const scrapedGames = await scraper.scrapeGames(
                  tournament.gomafiaId
                );

                console.log(
                  `[GamesPhase] Scraped ${scrapedGames.length} games for tournament ${tournament.name}`
                );

                return {
                  tournament,
                  scrapedGames,
                  success: true,
                };
              } catch (error) {
                console.error(
                  `[GamesPhase] Failed to process tournament ${tournament.name}:`,
                  error
                );
                return {
                  tournament,
                  scrapedGames: [],
                  success: false,
                  error:
                    error instanceof Error ? error.message : 'Unknown error',
                };
              } finally {
                // Always close page to free resources, even on error
                if (page) {
                  await page.close().catch(() => {
                    // Ignore errors when closing page
                  });
                }
              }
            })
          );

          // Process results from parallel chunk
          for (const result of chunkResults) {
            const { tournament, scrapedGames, success, error } = result;

            if (!success) {
              errorCount++;
              processedTournaments++;
              this.orchestrator.recordInvalidRecord(
                'Game',
                `Tournament processing failed: ${error || 'Unknown error'}`,
                { tournamentId: tournament.gomafiaId }
              );
            } else {
              // Add tournament game count to buffer for batch update
              // IMPORTANT: This must happen even when scrapedGames.length === 0
              tournamentGameCountsBuffer.push({
                tournamentId: tournament.id,
                gameCount: scrapedGames.length,
              });

              // Add games to buffer
              for (const gameData of scrapedGames) {
                gamesBuffer.push({
                  gameData,
                  tournamentId: tournament.id,
                });
              }

              processedTournaments++;
            }

            // Save games and update tournament game counts every SAVE_BATCH_SIZE tournaments
            if (processedTournaments % SAVE_BATCH_SIZE === 0) {
              // Save games
              const gamesToSave = gamesBuffer.splice(0, gamesBuffer.length);
              await saveBufferedGames(gamesToSave);

              // Batch update tournament game counts
              const countsToUpdate = tournamentGameCountsBuffer.splice(
                0,
                tournamentGameCountsBuffer.length
              );
              await updateTournamentGameCounts(countsToUpdate);
            }

            // Update progress after each tournament
            await this.updateProgressAfterTournament(
              processedTournaments,
              tournaments.length,
              phaseStartProgress,
              phaseEndProgress,
              phaseProgressRange,
              tournament.name,
              errorCount
            );
          }
        }

        // Save checkpoint
        const checkpoint = this.createCheckpoint(
          batchIndex,
          totalBatches,
          (batch as Array<{ gomafiaId: string }>).map(
            (t: { gomafiaId: string }) => t.gomafiaId
          )
        );
        await this.orchestrator.saveCheckpoint(checkpoint);

        console.log(
          `[GamesPhase] Processed batch ${batchIndex + 1}/${totalBatches} (${processedTournaments}/${tournaments.length} tournaments)`
        );
      }
    );

    // Save any remaining games in buffer at the end
    if (gamesBuffer.length > 0) {
      const gamesToSave = gamesBuffer.splice(0, gamesBuffer.length);
      await saveBufferedGames(gamesToSave);
    }

    // Update any remaining tournament game counts at the end
    if (tournamentGameCountsBuffer.length > 0) {
      const countsToUpdate = tournamentGameCountsBuffer.splice(
        0,
        tournamentGameCountsBuffer.length
      );
      await updateTournamentGameCounts(countsToUpdate);
    }

    console.log(
      `[GamesPhase] Games import complete (${totalGames} games, ${totalParticipations} participations, ${errorCount} errors)`
    );
  }

  /**
   * Update progress after processing a tournament.
   * This includes updating syncStatus and importProgress.
   */
  private async updateProgressAfterTournament(
    processedTournaments: number,
    totalTournaments: number,
    phaseStartProgress: number,
    phaseEndProgress: number,
    phaseProgressRange: number,
    tournamentName: string,
    errorCount: number
  ): Promise<void> {
    // Calculate progress percentage
    const progress = Math.min(
      phaseEndProgress,
      phaseStartProgress +
        Math.floor(
          (processedTournaments / totalTournaments) * phaseProgressRange
        )
    );

    // Update syncStatus
    await resilientDB.execute((db) =>
      db.syncStatus.update({
        where: { id: 'current' },
        data: {
          progress,
          currentOperation: `Processing games: ${tournamentName} (${processedTournaments}/${totalTournaments} tournaments)`,
          totalRecordsProcessed: totalTournaments,
          validRecords: processedTournaments,
          invalidRecords: errorCount,
          updatedAt: new Date(),
        },
      })
    );

    // Also update importProgress for terminal output
    try {
      const activeImport = await resilientDB.execute((db) =>
        db.importProgress.findFirst({
          where: {
            operation: 'games',
            status: 'RUNNING',
          },
          orderBy: {
            startTime: 'desc',
          },
        })
      );

      if (activeImport) {
        await importOrchestrator.updateProgress(
          activeImport.id,
          processedTournaments,
          errorCount,
          totalTournaments
        );
      }
    } catch (error) {
      // Silently fail - progress polling will pick it up
      console.warn('[GamesPhase] Could not update importProgress:', error);
    }
  }

  /**
   * Validate game data with Zod schema.
   */
  async validateData(data: GameRawData): Promise<boolean> {
    const result = gameSchema.safeParse(data);
    return result.success;
  }

  /**
   * Check if game already exists.
   */
  async checkDuplicate(gomafiaId: string): Promise<boolean> {
    return await this.orchestrator.checkDuplicate('Game', gomafiaId);
  }

  /**
   * Create checkpoint for this phase.
   */
  createCheckpoint(
    batchIndex: number,
    totalBatches: number,
    processedIds: string[]
  ): ImportCheckpoint {
    return {
      currentPhase: 'GAMES',
      currentBatch: batchIndex,
      lastProcessedId:
        processedIds.length > 0 ? processedIds[processedIds.length - 1] : null,
      processedIds,
      progress: Math.floor(((batchIndex + 1) / totalBatches) * 100),
    };
  }
}
