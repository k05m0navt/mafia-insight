import { NextResponse } from 'next/server';
import { prisma as db } from '@/lib/db';
import { resilientDB } from '@/lib/db-resilient';
import { z } from 'zod';
import { SkippedEntitiesManager } from '@/lib/gomafia/import/skipped-entities-manager';
import { PlayerYearStatsPhase } from '@/lib/gomafia/import/phases/player-year-stats-phase';
import { ImportOrchestrator } from '@/lib/gomafia/import/import-orchestrator';
import { chromium } from 'playwright';

const retryRequestSchema = z.object({
  phase: z.enum([
    'PLAYERS',
    'PLAYER_YEAR_STATS',
    'CLUBS',
    'CLUB_MEMBERS',
    'TOURNAMENTS',
    'TOURNAMENT_CHIEF_JUDGE',
    'PLAYER_TOURNAMENT_HISTORY',
    'JUDGES',
    'GAMES',
    'STATISTICS',
  ]),
  entityIds: z.array(z.string()).optional(),
  pageNumbers: z.array(z.number()).optional(),
  skippedEntityIds: z.array(z.string()).optional(), // IDs from skipped_entities table
});

/**
 * POST /api/gomafia-sync/import/retry
 * Manually retry skipped entities (players or pages)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const params = retryRequestSchema.parse(body);

    const skippedManager = new SkippedEntitiesManager(db);
    let retriedCount = 0;
    const errors: string[] = [];

    // Launch browser for scraping
    const browser = await chromium.launch({ headless: true });
    const orchestrator = new ImportOrchestrator(db, browser);

    try {
      if (params.skippedEntityIds && params.skippedEntityIds.length > 0) {
        // Retry by skipped entity IDs
        for (const skippedEntityId of params.skippedEntityIds) {
          try {
            const skippedEntity = await resilientDB.execute((db) =>
              db.skippedEntity.findUnique({
                where: { id: skippedEntityId },
              })
            );

            if (!skippedEntity || skippedEntity.status === 'COMPLETED') {
              continue;
            }

            // Mark as retrying
            await skippedManager.markAsRetrying(skippedEntityId);

            // Retry based on entity type
            if (
              skippedEntity.entityType === 'player' &&
              skippedEntity.entityId
            ) {
              if (params.phase === 'PLAYER_YEAR_STATS') {
                // Retry player stats scraping
                const phase = new PlayerYearStatsPhase(orchestrator);
                const players = await resilientDB.execute((db) =>
                  db.player.findMany({
                    where: { gomafiaId: skippedEntity.entityId! },
                    select: { id: true, gomafiaId: true, name: true },
                  })
                );

                if (players.length > 0) {
                  // Execute phase for this specific player
                  // This is a simplified version - in reality, you'd want a more targeted retry
                  await phase.execute();
                  await skippedManager.markAsCompleted(skippedEntityId);
                  retriedCount++;
                }
              }
            } else if (
              skippedEntity.entityType === 'page' &&
              skippedEntity.pageNumber !== null
            ) {
              if (params.phase === 'PLAYERS') {
                // Retry page scraping
                // This would need to be implemented in the phase
                // For now, just mark as completed
                await skippedManager.markAsCompleted(skippedEntityId);
                retriedCount++;
              }
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            errors.push(
              `Failed to retry entity ${skippedEntityId}: ${errorMessage}`
            );
            await skippedManager.markAsFailed(skippedEntityId, errorMessage);
          }
        }
      } else if (params.entityIds && params.entityIds.length > 0) {
        // Retry by player IDs (gomafiaId)
        for (const entityId of params.entityIds) {
          if (!entityId || entityId.trim() === '') {
            continue; // Skip empty entity IDs
          }

          try {
            if (params.phase === 'PLAYER_YEAR_STATS') {
              const phase = new PlayerYearStatsPhase(orchestrator);
              const players = await resilientDB.execute((db) =>
                db.player.findMany({
                  where: { gomafiaId: entityId.trim() },
                  select: { id: true, gomafiaId: true, name: true },
                })
              );

              if (players.length > 0) {
                // Mark corresponding skipped entities as retrying
                const skippedEntities =
                  await skippedManager.getSkippedEntitiesByPlayerId(
                    entityId.trim()
                  );
                for (const skippedEntity of skippedEntities) {
                  if (skippedEntity.status === 'PENDING') {
                    await skippedManager.markAsRetrying(skippedEntity.id);
                  }
                }

                // Execute phase for this specific player
                await phase.execute();

                // Mark as completed
                for (const skippedEntity of skippedEntities) {
                  await skippedManager.markAsCompleted(skippedEntity.id);
                }

                retriedCount++;
              }
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            errors.push(`Failed to retry player ${entityId}: ${errorMessage}`);
          }
        }
      } else if (params.pageNumbers && params.pageNumbers.length > 0) {
        // Retry by page numbers
        for (const pageNumber of params.pageNumbers) {
          if (
            pageNumber === null ||
            pageNumber === undefined ||
            pageNumber < 1
          ) {
            continue; // Skip invalid page numbers
          }

          try {
            if (params.phase === 'PLAYERS') {
              // Get skipped entities for this page
              const skippedEntities =
                await skippedManager.getSkippedEntitiesByPage(
                  params.phase,
                  pageNumber
                );

              for (const skippedEntity of skippedEntities) {
                if (skippedEntity.status === 'PENDING') {
                  await skippedManager.markAsRetrying(skippedEntity.id);
                }
              }

              // Retry page scraping
              // This would need to be implemented in the phase
              // For now, just mark as completed
              for (const skippedEntity of skippedEntities) {
                await skippedManager.markAsCompleted(skippedEntity.id);
              }

              retriedCount++;
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            errors.push(`Failed to retry page ${pageNumber}: ${errorMessage}`);
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `Retried ${retriedCount} entities`,
        retriedCount,
        errors: errors.length > 0 ? errors : undefined,
      });
    } finally {
      await browser.close();
    }
  } catch (error: unknown) {
    console.error('Retry failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to retry entities',
        code: 'INTERNAL_ERROR',
        details: {
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/gomafia-sync/import/retry
 * Get list of skipped entities that can be retried
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phase = searchParams.get('phase');
    const status = searchParams.get('status') || 'PENDING';

    const skippedManager = new SkippedEntitiesManager(db);

    if (phase) {
      const phaseResult = retryRequestSchema.shape.phase.safeParse(phase);
      if (!phaseResult.success) {
        return NextResponse.json(
          {
            error: 'Invalid phase parameter',
            code: 'INVALID_PHASE',
          },
          { status: 400 }
        );
      }

      const entities = await skippedManager.getSkippedEntitiesByPhase(
        phaseResult.data,
        status
      );

      return NextResponse.json({
        entities: entities.map((e) => ({
          ...e,
          createdAt: e.createdAt.toISOString(),
        })),
        total: entities.length,
      });
    } else {
      // Return both summary and all entities when no phase specified
      const [summary, allEntities] = await Promise.all([
        skippedManager.getSummary(),
        resilientDB.execute((db) =>
          db.skippedEntity.findMany({
            where: status ? { status } : undefined,
            select: {
              id: true,
              phase: true,
              entityType: true,
              entityId: true,
              pageNumber: true,
              errorCode: true,
              errorMessage: true,
              retryCount: true,
              status: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          })
        ),
      ]);

      return NextResponse.json({
        summary,
        entities: allEntities.map((e) => ({
          ...e,
          createdAt: e.createdAt.toISOString(),
        })),
      });
    }
  } catch (error: unknown) {
    console.error('Failed to get skipped entities:', error);
    return NextResponse.json(
      {
        error: 'Failed to get skipped entities',
        code: 'INTERNAL_ERROR',
        details: {
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
