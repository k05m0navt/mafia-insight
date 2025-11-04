import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/apiAuth';
import { prisma as db } from '@/lib/db';
import {
  saveRetriedPlayers,
  saveRetriedClubs,
  saveRetriedTournaments,
} from '@/lib/gomafia/import/save-retried-data';

/**
 * GET /api/admin/import/skipped-pages
 * Get skipped pages from recent sync logs
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate and check admin role
    const { role } = await authenticateRequest(request);

    if (role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType'); // 'players', 'clubs', 'tournaments'
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get recent sync logs
    const syncLogs = await db.syncLog.findMany({
      orderBy: { startTime: 'desc' },
      take: limit,
      where: {
        status: {
          in: ['COMPLETED', 'FAILED'],
        },
      },
    });

    // Extract skipped pages from errors field
    const skippedPagesByEntity: Record<
      string,
      { syncLogId: string; pages: number[]; timestamp: Date }
    > = {};

    for (const log of syncLogs) {
      if (!log.errors || typeof log.errors !== 'object') continue;

      const errors = log.errors as Record<string, unknown>;

      // Check for skipped pages in error data
      if (errors.skippedPages) {
        const skipped = errors.skippedPages as Record<string, number[]>;
        for (const [phase, pages] of Object.entries(skipped)) {
          // Map phase names to entity types
          let entityType = '';
          if (phase === 'PLAYERS') entityType = 'players';
          else if (phase === 'CLUBS') entityType = 'clubs';
          else if (phase === 'TOURNAMENTS') entityType = 'tournaments';
          else continue; // Skip unknown phases

          if (!skippedPagesByEntity[entityType]) {
            skippedPagesByEntity[entityType] = {
              syncLogId: log.id,
              pages: [],
              timestamp: log.startTime,
            };
          }
          skippedPagesByEntity[entityType].pages.push(...pages);
        }
      }

      // Also check errorSummary for phase-specific skipped pages
      if (errors.errorSummary) {
        const errorSummary = errors.errorSummary as Record<string, unknown>;
        if (errorSummary.skippedPagesByPhase) {
          const skippedByPhase = errorSummary.skippedPagesByPhase as Record<
            string,
            Record<string, number[]>
          >;
          for (const [phase, phaseSkipped] of Object.entries(skippedByPhase)) {
            // Map phase to entity type
            let entityType = '';
            if (phase === 'PLAYERS') entityType = 'players';
            else if (phase === 'CLUBS') entityType = 'clubs';
            else if (phase === 'TOURNAMENTS') entityType = 'tournaments';

            if (entityType && phaseSkipped.skippedPages) {
              if (!skippedPagesByEntity[entityType]) {
                skippedPagesByEntity[entityType] = {
                  syncLogId: log.id,
                  pages: [],
                  timestamp: log.startTime,
                };
              }
              skippedPagesByEntity[entityType].pages.push(
                ...(phaseSkipped.skippedPages as number[])
              );
            }
          }
        }
      }
    }

    // Filter by entity type if provided
    const result = entityType
      ? {
          [entityType]: skippedPagesByEntity[entityType] || {
            syncLogId: null,
            pages: [],
            timestamp: new Date(),
          },
        }
      : skippedPagesByEntity;

    return NextResponse.json({
      success: true,
      skippedPages: result,
    });
  } catch (error: unknown) {
    console.error('Error fetching skipped pages:', error);

    // Handle authentication/authorization errors
    if (error instanceof Error) {
      if (error.message?.includes('Authentication')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      if (error.message?.includes('Role') || error.message?.includes('Admin')) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch skipped pages' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/import/skipped-pages/retry
 * Retry scraping specific pages
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate and check admin role
    const { role } = await authenticateRequest(request);

    if (role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { entityType, pageNumbers, options } = body;

    if (
      !entityType ||
      !Array.isArray(pageNumbers) ||
      pageNumbers.length === 0
    ) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: 'entityType and pageNumbers array are required',
        },
        { status: 400 }
      );
    }

    // Validate entity type
    const validEntityTypes = ['players', 'clubs', 'tournaments'];
    if (!validEntityTypes.includes(entityType)) {
      return NextResponse.json(
        {
          error: 'Invalid entity type',
          message: `entityType must be one of: ${validEntityTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Launch browser and retry pages
    const { chromium } = await import('playwright');
    const { RateLimiter } = await import('@/lib/gomafia/import/rate-limiter');

    let scraper;
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const rateLimiter = new RateLimiter(2000);

    try {
      switch (entityType) {
        case 'players': {
          const { PlayersScraper } = await import(
            '@/lib/gomafia/scrapers/players-scraper'
          );
          scraper = new PlayersScraper(page, rateLimiter);
          break;
        }
        case 'clubs': {
          const { ClubsScraper } = await import(
            '@/lib/gomafia/scrapers/clubs-scraper'
          );
          scraper = new ClubsScraper(page, rateLimiter);
          break;
        }
        case 'tournaments': {
          const { TournamentsScraper } = await import(
            '@/lib/gomafia/scrapers/tournaments-scraper'
          );
          scraper = new TournamentsScraper(page, rateLimiter);
          break;
        }
      }

      if (
        !scraper ||
        typeof (scraper as any).retrySkippedPages !== 'function'
      ) {
        throw new Error(`Scraper for ${entityType} does not support retry`);
      }

      // Prepare options based on entity type
      let retryOptions: any = {};
      if (entityType === 'players' || entityType === 'clubs') {
        retryOptions = {
          year: options?.year || new Date().getFullYear(),
          region: options?.region || 'all',
        };
      } else if (entityType === 'tournaments') {
        retryOptions = {
          timeFilter: options?.timeFilter || 'all',
        };
      }

      // Retry pages
      const retriedData = await (scraper as any).retrySkippedPages(
        pageNumbers,
        retryOptions
      );

      await browser.close();

      // Save retried data to database
      let saveResult;
      switch (entityType) {
        case 'players':
          saveResult = await saveRetriedPlayers(retriedData);
          break;
        case 'clubs':
          saveResult = await saveRetriedClubs(retriedData);
          break;
        case 'tournaments':
          saveResult = await saveRetriedTournaments(retriedData);
          break;
        default:
          throw new Error(`Unknown entity type: ${entityType}`);
      }

      return NextResponse.json({
        success: true,
        entityType,
        pagesRetried: pageNumbers,
        recordsRetrieved: retriedData.length,
        saved: saveResult.saved,
        skipped: saveResult.skipped,
        errors: saveResult.errors,
        message: `Successfully retried ${retriedData.length} records from ${pageNumbers.length} pages. Saved: ${saveResult.saved}, Skipped: ${saveResult.skipped}, Errors: ${saveResult.errors}`,
      });
    } catch (error) {
      await browser.close();
      throw error;
    }
  } catch (error: unknown) {
    console.error('Error retrying skipped pages:', error);

    // Handle authentication/authorization errors
    if (error instanceof Error) {
      if (error.message?.includes('Authentication')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      if (error.message?.includes('Role') || error.message?.includes('Admin')) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to retry skipped pages',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
