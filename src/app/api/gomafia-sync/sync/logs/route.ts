import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('limit') || '20'))
    );
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Validate pagination parameters
    if (page < 1 || limit < 1) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Validate date parameters
    let startDateFilter: Date | undefined;
    let endDateFilter: Date | undefined;

    if (startDate) {
      startDateFilter = new Date(startDate);
      if (isNaN(startDateFilter.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format for startDate' },
          { status: 400 }
        );
      }
    }

    if (endDate) {
      endDateFilter = new Date(endDate);
      if (isNaN(endDateFilter.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format for endDate' },
          { status: 400 }
        );
      }
      // Set to end of day
      endDateFilter.setHours(23, 59, 59, 999);
    }

    // Build where clause
    const where: {
      status?: string;
      type?: string;
      startTime?: {
        gte?: Date;
        lte?: Date;
      };
    } = {};

    if (status && ['RUNNING', 'COMPLETED', 'FAILED'].includes(status)) {
      where.status = status;
    }

    if (type && ['FULL', 'INCREMENTAL'].includes(type)) {
      where.type = type;
    }

    if (startDateFilter || endDateFilter) {
      where.startTime = {};
      if (startDateFilter) {
        where.startTime.gte = startDateFilter;
      }
      if (endDateFilter) {
        where.startTime.lte = endDateFilter;
      }
    }

    // Get sync logs with pagination
    const [logs, total] = await Promise.all([
      db.syncLog.findMany({
        where,
        orderBy: { startTime: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.syncLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Failed to get sync logs:', error);
    return NextResponse.json(
      { error: 'Failed to get sync logs' },
      { status: 500 }
    );
  }
}
