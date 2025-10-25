import { NextRequest, NextResponse } from 'next/server';
import { ClubService } from '@/services/clubService';

const clubService = new ClubService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || undefined;

    const result = await clubService.getClubs(page, limit, search);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching clubs:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch clubs',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...clubData } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const club = await clubService.createClub(clubData, userId);

    return NextResponse.json(club, { status: 201 });
  } catch (error) {
    console.error('Error creating club:', error);

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to create club',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
