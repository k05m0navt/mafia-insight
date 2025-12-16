import { prisma } from '@/lib/db';
import { AuditActionType, Prisma } from '@prisma/client';

export interface AuditLogEntry {
  actionType: AuditActionType;
  adminUserId: string;
  targetUserId?: string;
  oldValue?: string;
  newValue?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log an admin action to the audit log
 */
export async function logAdminAction(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actionType: entry.actionType,
        adminUserId: entry.adminUserId,
        targetUserId: entry.targetUserId,
        oldValue: entry.oldValue,
        newValue: entry.newValue,
        metadata: (entry.metadata || {}) as Prisma.InputJsonValue,
      },
    });
  } catch (error) {
    // Log error but don't throw - audit logging should not break the main flow
    console.error('Failed to log admin action:', error);
  }
}

/**
 * Get audit log entries with pagination
 */
export async function getAuditLogs(params: {
  page?: number;
  limit?: number;
  actionType?: AuditActionType;
  adminUserId?: string;
  targetUserId?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const page = params.page || 1;
  const limit = params.limit || 50;
  const skip = (page - 1) * limit;

  const where: {
    actionType?: AuditActionType;
    adminUserId?: string;
    targetUserId?: string;
    createdAt?: {
      gte?: Date;
      lte?: Date;
    };
  } = {};

  if (params.actionType) {
    where.actionType = params.actionType;
  }

  if (params.adminUserId) {
    where.adminUserId = params.adminUserId;
  }

  if (params.targetUserId) {
    where.targetUserId = params.targetUserId;
  }

  if (params.startDate || params.endDate) {
    where.createdAt = {};
    if (params.startDate) {
      where.createdAt.gte = params.startDate;
    }
    if (params.endDate) {
      where.createdAt.lte = params.endDate;
    }
  }

  const [entries, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        admin: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        target: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    entries,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
