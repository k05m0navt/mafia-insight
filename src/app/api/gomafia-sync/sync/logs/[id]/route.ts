import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Sync log ID is required' },
        { status: 400 }
      );
    }

    const syncLog = await db.syncLog.findUnique({
      where: { id },
    });

    if (!syncLog) {
      return NextResponse.json(
        { error: 'Sync log not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(syncLog);
  } catch (error) {
    console.error('Failed to get sync log details:', error);
    return NextResponse.json(
      { error: 'Failed to get sync log details' },
      { status: 500 }
    );
  }
}
