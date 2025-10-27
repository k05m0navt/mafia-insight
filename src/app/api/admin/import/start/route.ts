import { NextRequest, NextResponse } from 'next/server';
import { dataImportStrategy } from '@/lib/gomafia/import/strategy';
import { z } from 'zod';

const requestSchema = z.object({
  strategy: z.string().min(1),
  data: z.array(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { strategy, data } = requestSchema.parse(body);

    // For demo purposes, create some sample data
    const sampleData = data || generateSampleData(strategy);

    const importId = await dataImportStrategy.executeImport(
      strategy,
      sampleData
    );

    return NextResponse.json({
      importId,
      message: `Import started for strategy: ${strategy}`,
    });
  } catch (error) {
    console.error('Error starting import:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to start import' },
      { status: 500 }
    );
  }
}

function generateSampleData(strategy: string): any[] {
  switch (strategy) {
    case 'players':
      return Array.from({ length: 100 }, (_, i) => ({
        id: `player_${i + 1}`,
        name: `Player ${i + 1}`,
        eloRating: 1000 + Math.floor(Math.random() * 500),
        totalGames: Math.floor(Math.random() * 100),
        wins: Math.floor(Math.random() * 50),
        losses: Math.floor(Math.random() * 50),
        region: ['US', 'CA', 'GB', 'DE', 'FR'][Math.floor(Math.random() * 5)],
      }));

    case 'tournaments':
      return Array.from({ length: 50 }, (_, i) => ({
        id: `tournament_${i + 1}`,
        name: `Tournament ${i + 1}`,
        date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        prizeMoney: Math.floor(Math.random() * 10000),
        maxPlayers: 16 + Math.floor(Math.random() * 32),
        region: ['US', 'CA', 'GB', 'DE', 'FR'][Math.floor(Math.random() * 5)],
      }));

    case 'games':
      return Array.from({ length: 200 }, (_, i) => ({
        id: `game_${i + 1}`,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        durationMinutes: 30 + Math.floor(Math.random() * 120),
        winner: ['BLACK', 'RED'][Math.floor(Math.random() * 2)],
        region: ['US', 'CA', 'GB', 'DE', 'FR'][Math.floor(Math.random() * 5)],
      }));

    case 'clubs':
      return Array.from({ length: 25 }, (_, i) => ({
        id: `club_${i + 1}`,
        name: `Club ${i + 1}`,
        region: ['US', 'CA', 'GB', 'DE', 'FR'][Math.floor(Math.random() * 5)],
        memberCount: 10 + Math.floor(Math.random() * 100),
      }));

    case 'player_stats':
      return Array.from({ length: 100 }, (_, i) => ({
        playerId: `player_${i + 1}`,
        year: 2024,
        totalGames: Math.floor(Math.random() * 50),
        donGames: Math.floor(Math.random() * 10),
        mafiaGames: Math.floor(Math.random() * 20),
        sheriffGames: Math.floor(Math.random() * 15),
        civilianGames: Math.floor(Math.random() * 30),
        eloRating: 1000 + Math.floor(Math.random() * 500),
        extraPoints: Math.floor(Math.random() * 100),
      }));

    case 'tournament_results':
      return Array.from({ length: 100 }, (_, i) => ({
        playerId: `player_${i + 1}`,
        tournamentId: `tournament_${Math.floor(Math.random() * 50) + 1}`,
        placement: Math.floor(Math.random() * 32) + 1,
        ggPoints: Math.floor(Math.random() * 1000),
        eloChange: Math.floor(Math.random() * 100) - 50,
      }));

    default:
      return [];
  }
}
