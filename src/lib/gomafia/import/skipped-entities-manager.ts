import { PrismaClient, Prisma } from '@prisma/client';
import { resilientDB } from '@/lib/db-resilient';

export type ImportPhase =
  | 'CLUBS'
  | 'PLAYERS'
  | 'CLUB_MEMBERS'
  | 'PLAYER_YEAR_STATS'
  | 'TOURNAMENTS'
  | 'TOURNAMENT_CHIEF_JUDGE'
  | 'PLAYER_TOURNAMENT_HISTORY'
  | 'JUDGES'
  | 'GAMES'
  | 'STATISTICS';

export interface SkippedEntityData {
  phase: ImportPhase;
  entityType: string;
  entityId?: string;
  pageNumber?: number;
  errorCode: string;
  errorMessage: string;
  errorDetails?: Record<string, unknown>;
  syncLogId?: string;
}

/**
 * Manages tracking of skipped entities during import.
 * Stores skipped players, pages, and other entities for manual retry.
 */
export class SkippedEntitiesManager {
  constructor(private db: PrismaClient) {}

  /**
   * Record a skipped entity for later retry.
   */
  async recordSkippedEntity(data: SkippedEntityData): Promise<string> {
    const skippedEntity = await resilientDB.execute((db) =>
      db.skippedEntity.create({
        data: {
          phase: data.phase,
          entityType: data.entityType,
          entityId: data.entityId ?? null,
          pageNumber: data.pageNumber ?? null,
          errorCode: data.errorCode,
          errorMessage: data.errorMessage,
          errorDetails: data.errorDetails
            ? (data.errorDetails as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          syncLogId: data.syncLogId ?? null,
          status: 'PENDING',
          retryCount: 0,
        },
      })
    );

    return skippedEntity.id;
  }

  /**
   * Get all skipped entities for a phase.
   */
  async getSkippedEntitiesByPhase(
    phase: ImportPhase,
    status?: string
  ): Promise<
    Array<{
      id: string;
      entityType: string;
      entityId: string | null;
      pageNumber: number | null;
      errorCode: string;
      errorMessage: string;
      retryCount: number;
      status: string;
      createdAt: Date;
    }>
  > {
    const where: {
      phase: string;
      status?: string;
    } = {
      phase,
    };

    if (status) {
      where.status = status;
    }

    const entities = await resilientDB.execute((db) =>
      db.skippedEntity.findMany({
        where,
        select: {
          id: true,
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
    );

    return entities;
  }

  /**
   * Get skipped entities by player ID.
   */
  async getSkippedEntitiesByPlayerId(playerId: string): Promise<
    Array<{
      id: string;
      phase: string;
      entityType: string;
      pageNumber: number | null;
      errorCode: string;
      errorMessage: string;
      retryCount: number;
      status: string;
      createdAt: Date;
    }>
  > {
    const entities = await resilientDB.execute((db) =>
      db.skippedEntity.findMany({
        where: {
          entityType: 'player',
          entityId: playerId,
        },
        select: {
          id: true,
          phase: true,
          entityType: true,
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
    );

    return entities;
  }

  /**
   * Get skipped entities by page number.
   */
  async getSkippedEntitiesByPage(
    phase: ImportPhase,
    pageNumber: number
  ): Promise<
    Array<{
      id: string;
      entityType: string;
      entityId: string | null;
      errorCode: string;
      errorMessage: string;
      retryCount: number;
      status: string;
      createdAt: Date;
    }>
  > {
    const entities = await resilientDB.execute((db) =>
      db.skippedEntity.findMany({
        where: {
          phase,
          pageNumber,
        },
        select: {
          id: true,
          entityType: true,
          entityId: true,
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
    );

    return entities;
  }

  /**
   * Mark a skipped entity as retrying.
   */
  async markAsRetrying(entityId: string): Promise<void> {
    await resilientDB.execute((db) =>
      db.skippedEntity.update({
        where: { id: entityId },
        data: {
          status: 'RETRYING',
          retryCount: { increment: 1 },
          lastRetryAt: new Date(),
        },
      })
    );
  }

  /**
   * Mark a skipped entity as completed.
   */
  async markAsCompleted(entityId: string): Promise<void> {
    await resilientDB.execute((db) =>
      db.skippedEntity.update({
        where: { id: entityId },
        data: {
          status: 'COMPLETED',
          updatedAt: new Date(),
        },
      })
    );
  }

  /**
   * Mark a skipped entity as failed after retry.
   */
  async markAsFailed(entityId: string, errorMessage?: string): Promise<void> {
    await resilientDB.execute((db) =>
      db.skippedEntity.update({
        where: { id: entityId },
        data: {
          status: 'FAILED',
          errorMessage: errorMessage ? errorMessage : undefined,
          updatedAt: new Date(),
        },
      })
    );
  }

  /**
   * Get summary of skipped entities by phase.
   */
  async getSummary(): Promise<
    Record<
      string,
      {
        total: number;
        pending: number;
        retrying: number;
        completed: number;
        failed: number;
      }
    >
  > {
    const allEntities = await resilientDB.execute((db) =>
      db.skippedEntity.findMany({
        select: {
          phase: true,
          status: true,
        },
      })
    );

    const summary: Record<
      string,
      {
        total: number;
        pending: number;
        retrying: number;
        completed: number;
        failed: number;
      }
    > = {};

    for (const entity of allEntities) {
      if (!summary[entity.phase]) {
        summary[entity.phase] = {
          total: 0,
          pending: 0,
          retrying: 0,
          completed: 0,
          failed: 0,
        };
      }

      summary[entity.phase].total++;
      if (entity.status === 'PENDING') summary[entity.phase].pending++;
      if (entity.status === 'RETRYING') summary[entity.phase].retrying++;
      if (entity.status === 'COMPLETED') summary[entity.phase].completed++;
      if (entity.status === 'FAILED') summary[entity.phase].failed++;
    }

    return summary;
  }

  /**
   * Delete completed skipped entities older than specified days.
   */
  async cleanupCompletedEntities(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await resilientDB.execute((db) =>
      db.skippedEntity.deleteMany({
        where: {
          status: 'COMPLETED',
          updatedAt: {
            lt: cutoffDate,
          },
        },
      })
    );

    return result.count;
  }
}
