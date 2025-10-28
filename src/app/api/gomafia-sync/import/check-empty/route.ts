import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

/**
 * GET /api/gomafia-sync/import/check-empty
 * Check if database is empty and should trigger auto-import
 */
export async function GET() {
  try {
    // Count players and games
    const [playerCount, gameCount] = await Promise.all([
      db.player.count(),
      db.game.count(),
    ]);

    const isEmpty = playerCount === 0 && gameCount === 0;
    const shouldAutoImport = isEmpty;

    return NextResponse.json({
      isEmpty,
      playerCount,
      gameCount,
      shouldAutoImport,
      message: isEmpty
        ? 'Database is empty. Consider triggering initial import.'
        : `Database contains ${playerCount} players and ${gameCount} games.`,
    });
  } catch (error: unknown) {
    console.error('Check empty failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to check database status',
        code: 'INTERNAL_ERROR',
        details: {
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
