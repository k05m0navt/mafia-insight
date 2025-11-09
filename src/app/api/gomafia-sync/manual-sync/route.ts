import { NextResponse } from 'next/server';
import { prisma as db } from '@/lib/db';
import { resilientDB } from '@/lib/db-resilient';
import { z } from 'zod';
import { chromium, type Browser, type Page } from 'playwright';
import { PlayerStatsScraper } from '@/lib/gomafia/scrapers/player-stats-scraper';
import { RateLimiter } from '@/lib/gomafia/import/rate-limiter';
import { ImportOrchestrator } from '@/lib/gomafia/import/import-orchestrator';
import { TournamentDetailScraper } from '@/lib/gomafia/scrapers/tournament-detail-scraper';
import { TournamentGamesScraper } from '@/lib/gomafia/scrapers/tournament-games-scraper';
import { ClubDetailScraper } from '@/lib/gomafia/scrapers/club-detail-scraper';
import type {
  PlayerTournamentRawData,
  PlayerYearStatsRawData,
} from '@/types/gomafia-entities';

const manualSyncRequestSchema = z.object({
  entityType: z.enum(['player', 'tournament', 'game', 'club']),
  entityId: z.string().min(1), // gomafiaId for player/tournament/club, or game gomafiaId
  syncOptions: z
    .object({
      includeStats: z.boolean().optional().default(true), // For players: sync year stats
      includeHistory: z.boolean().optional().default(false), // For players: sync tournament history
      includeGames: z.boolean().optional().default(true), // For tournaments: sync games
      includeMembers: z.boolean().optional().default(true), // For clubs: sync members
    })
    .optional()
    .default(() => ({
      includeStats: true,
      includeHistory: false,
      includeGames: true,
      includeMembers: true,
    })),
});

type ManualSyncResult<TData = unknown> = {
  success: boolean;
  message: string;
  entityId?: string;
  data?: TData;
  errors?: string[];
};

interface PlayerStatsSummary {
  yearsSynced: number;
  stats: PlayerYearStatsRawData[];
}

interface PlayerHistorySummary {
  tournamentsFound: number;
  tournaments: PlayerTournamentRawData[];
}

interface PlayerSyncData {
  stats: PlayerStatsSummary | null;
  history: PlayerHistorySummary | null;
}

type TournamentGamesSummary = {
  gamesFound: number;
  games: Awaited<ReturnType<TournamentGamesScraper['scrapeGames']>>;
};

interface TournamentSyncData {
  chiefJudge: Awaited<ReturnType<TournamentDetailScraper['scrapeChiefJudge']>>;
  games: TournamentGamesSummary | null;
}

type ClubMembersResult = Awaited<
  ReturnType<ClubDetailScraper['scrapeMembersAndPresident']>
>;

interface ClubSyncData {
  members: {
    membersFound: number;
    president: ClubMembersResult['president'];
    members: ClubMembersResult['members'];
  } | null;
}

type NextWindowData = {
  __NEXT_DATA__?: {
    props?: {
      pageProps?: {
        serverData?: {
          user?: {
            login?: string | null;
            first_name?: string | null;
            last_name?: string | null;
            club_id?: string | number | null;
            elo?: string | number | null;
          };
          stats?: {
            primary?: {
              total_games?: string | number | null;
            };
          };
        };
      };
    };
  };
};

type ManualSyncDataPayload =
  | PlayerSyncData
  | TournamentSyncData
  | ClubSyncData
  | null;

/**
 * POST /api/gomafia-sync/manual-sync
 * Manually sync a specific entity from gomafia.pro
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const params = manualSyncRequestSchema.parse(body);

    const browser = await chromium.launch({ headless: true });
    const rateLimiter = new RateLimiter(1000);
    const orchestrator = new ImportOrchestrator(db, browser);

    try {
      let result: ManualSyncResult<ManualSyncDataPayload>;

      switch (params.entityType) {
        case 'player':
          result = await syncPlayer(
            params.entityId,
            params.syncOptions,
            browser,
            rateLimiter,
            orchestrator
          );
          break;

        case 'tournament':
          result = await syncTournament(
            params.entityId,
            params.syncOptions,
            browser,
            rateLimiter
          );
          break;

        case 'club':
          result = await syncClub(
            params.entityId,
            params.syncOptions,
            browser,
            rateLimiter
          );
          break;

        case 'game':
          result = await syncGame(params.entityId, browser, rateLimiter);
          break;

        default:
          return NextResponse.json(
            {
              error: 'Invalid entity type',
              code: 'INVALID_ENTITY_TYPE',
            },
            { status: 400 }
          );
      }

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: result.message,
          entityId: result.entityId,
          data: result.data,
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: result.message,
            errors: result.errors,
          },
          { status: 500 }
        );
      }
    } finally {
      await browser.close();
    }
  } catch (error: unknown) {
    console.error('Manual sync failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync entity',
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
 * Sync a single player by gomafiaId
 */
async function syncPlayer(
  gomafiaId: string,
  options: {
    includeStats?: boolean;
    includeHistory?: boolean;
  },
  browser: Browser,
  rateLimiter: RateLimiter,
  orchestrator: ImportOrchestrator
): Promise<ManualSyncResult<PlayerSyncData>> {
  const errors: string[] = [];
  const systemUserId = await orchestrator.getSystemUser();

  try {
    // Step 1: Sync player basic info
    // Navigate to player stats page to get basic info
    const page = await browser.newPage();

    // Navigate to player stats page to get basic info
    // The stats page URL is /stats/{gomafiaId}
    await page.goto(`https://gomafia.pro/stats/${gomafiaId}`, {
      waitUntil: 'load',
      timeout: 30000,
    });

    // Wait for page to load
    await page
      .waitForLoadState('networkidle', { timeout: 5000 })
      .catch(() => {});

    const profileSnapshot = await extractPlayerProfile(page, gomafiaId);

    const fallbackDomName =
      profileSnapshot?.displayName ??
      (profileSnapshot ? null : await extractPlayerNameFromDom(page));

    const fullNameFromProfile =
      profileSnapshot && profileSnapshot.firstName && profileSnapshot.lastName
        ? `${profileSnapshot.firstName} ${profileSnapshot.lastName}`.trim()
        : profileSnapshot?.firstName || profileSnapshot?.lastName || null;

    const candidatePlayerName =
      profileSnapshot?.login ||
      profileSnapshot?.displayName ||
      fullNameFromProfile ||
      fallbackDomName ||
      null;

    const sanitizedPlayerName = sanitizePlayerName(candidatePlayerName);

    const existingPlayer = await resilientDB.execute((db) =>
      db.player.findUnique({
        where: { gomafiaId },
      })
    );

    const resolvedClubId =
      profileSnapshot?.clubGomafiaId != null
        ? await resolveClubId(profileSnapshot.clubGomafiaId)
        : null;

    if (!existingPlayer && !sanitizedPlayerName) {
      return {
        success: false,
        message: `Player with ID ${gomafiaId} not found on gomafia.pro`,
        errors: [
          'Player not found',
          'Unable to extract valid player name from stats page',
        ],
      };
    }

    if (!existingPlayer) {
      await resilientDB.execute((db) =>
        db.player.create({
          data: {
            gomafiaId,
            name: sanitizedPlayerName as string,
            userId: systemUserId,
            syncStatus: 'SYNCED',
            lastSyncAt: new Date(),
            ...(resolvedClubId ? { clubId: resolvedClubId } : {}),
            ...(typeof profileSnapshot?.eloRating === 'number' &&
            !Number.isNaN(profileSnapshot.eloRating)
              ? { eloRating: Math.round(profileSnapshot.eloRating) }
              : {}),
            ...(typeof profileSnapshot?.totalGames === 'number'
              ? { totalGames: profileSnapshot.totalGames }
              : {}),
          },
        })
      );
    } else {
      const updateData: {
        name?: string;
        syncStatus: 'SYNCED';
        lastSyncAt: Date;
        clubId?: string;
        eloRating?: number;
        totalGames?: number;
      } = {
        syncStatus: 'SYNCED',
        lastSyncAt: new Date(),
      };

      if (sanitizedPlayerName && sanitizedPlayerName !== existingPlayer.name) {
        updateData.name = sanitizedPlayerName;
      }

      if (resolvedClubId && resolvedClubId !== existingPlayer.clubId) {
        updateData.clubId = resolvedClubId;
      }

      if (
        typeof profileSnapshot?.eloRating === 'number' &&
        !Number.isNaN(profileSnapshot.eloRating)
      ) {
        updateData.eloRating = Math.round(profileSnapshot.eloRating);
      }

      if (typeof profileSnapshot?.totalGames === 'number') {
        updateData.totalGames = profileSnapshot.totalGames;
      }

      await resilientDB.execute((db) =>
        db.player.update({
          where: { gomafiaId },
          data: updateData,
        })
      );

      if (!sanitizedPlayerName) {
        errors.push(
          `Player name fallback used for ${gomafiaId} - scraped name was invalid (e.g. header text). Existing database name retained.`
        );
      }
    }

    let statsData: PlayerStatsSummary | null = null;
    let historyData: PlayerHistorySummary | null = null;

    // Step 2: Sync player year stats if requested
    if (options.includeStats) {
      try {
        const statsScraper = new PlayerStatsScraper(page);
        const allStats = await statsScraper.scrapeAllYears(gomafiaId);

        // Save stats to database
        const player = await resilientDB.execute((db) =>
          db.player.findUnique({
            where: { gomafiaId },
            select: { id: true },
          })
        );

        if (player) {
          // Delete existing stats for this player
          await resilientDB.execute((db) =>
            db.playerYearStats.deleteMany({
              where: { playerId: player.id },
            })
          );

          // Insert new stats
          for (const stat of allStats) {
            await resilientDB.execute((db) =>
              db.playerYearStats.create({
                data: {
                  playerId: player.id,
                  year: stat.year,
                  totalGames: stat.totalGames,
                  donGames: stat.donGames,
                  mafiaGames: stat.mafiaGames,
                  sheriffGames: stat.sheriffGames,
                  civilianGames: stat.civilianGames,
                  eloRating: stat.eloRating,
                  extraPoints: stat.extraPoints,
                },
              })
            );
          }

          statsData = {
            yearsSynced: allStats.length,
            stats: allStats,
          };
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        errors.push(`Failed to sync player stats: ${errorMessage}`);
      }
    }

    // Step 3: Sync tournament history if requested
    if (options.includeHistory) {
      try {
        // Import tournament history scraper
        const { PlayerTournamentHistoryScraper } = await import(
          '@/lib/gomafia/scrapers/player-tournament-history-scraper'
        );
        const historyScraper = new PlayerTournamentHistoryScraper(
          page,
          rateLimiter
        );
        const history = await historyScraper.scrapeHistory(gomafiaId);

        // Save tournament history
        const player = await resilientDB.execute((db) =>
          db.player.findUnique({
            where: { gomafiaId },
            select: { id: true },
          })
        );

        if (player && history.length > 0) {
          // This would require syncing tournaments first, then linking
          // For now, just return the data
          historyData = {
            tournamentsFound: history.length,
            tournaments: history,
          };
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        errors.push(`Failed to sync tournament history: ${errorMessage}`);
      }
    }

    await page.close();

    return {
      success: true,
      message: `Successfully synced player ${gomafiaId}`,
      entityId: gomafiaId,
      data: {
        stats: statsData,
        history: historyData,
      },
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Failed to sync player: ${errorMessage}`,
      errors: [errorMessage],
    };
  }
}

function sanitizePlayerName(name: string | null): string | null {
  if (!name) {
    return null;
  }

  const normalized = name.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return null;
  }

  const lower = normalized.toLowerCase();
  const disallowedNames = [
    'go mafia',
    'gomafia pro',
    'gomafia.pro',
    'gomafia — платформа',
    'gomafia - платформа',
  ];

  if (
    disallowedNames.some(
      (entry) =>
        lower === entry ||
        lower.startsWith(`${entry} `) ||
        lower.endsWith(` ${entry}`)
    )
  ) {
    return null;
  }

  if (!/[0-9a-zа-яё]/i.test(normalized)) {
    return null;
  }

  return normalized;
}

async function extractPlayerProfile(
  page: Page,
  gomafiaId: string
): Promise<PlayerProfileSnapshot | null> {
  try {
    const serverData = await page
      .evaluate<{
        login: string | null;
        firstName: string | null;
        lastName: string | null;
        clubId: string | null;
        elo: number | null;
        totalGames: number | null;
      } | null>(() => {
        type NextWindow = Window & typeof globalThis & NextWindowData;
        const nextWindow = window as NextWindow;
        const data = nextWindow.__NEXT_DATA__?.props?.pageProps?.serverData;
        if (!data) {
          return null;
        }

        const user = data.user ?? {};
        const stats = data.stats ?? {};

        const login =
          typeof user.login === 'string' && user.login.trim().length > 0
            ? user.login.trim()
            : null;

        const firstName =
          typeof user.first_name === 'string' &&
          user.first_name.trim().length > 0
            ? user.first_name.trim()
            : null;

        const lastName =
          typeof user.last_name === 'string' && user.last_name.trim().length > 0
            ? user.last_name.trim()
            : null;

        const clubId =
          user.club_id != null ? String(user.club_id).trim() || null : null;

        let elo: number | null = null;
        if (typeof user.elo === 'number') {
          elo = user.elo;
        } else if (typeof user.elo === 'string') {
          const parsed = Number.parseFloat(user.elo);
          elo = Number.isNaN(parsed) ? null : parsed;
        }

        const totalGamesValue = stats?.primary?.total_games;
        let totalGames: number | null = null;
        if (typeof totalGamesValue === 'number') {
          totalGames = totalGamesValue;
        } else if (typeof totalGamesValue === 'string') {
          const parsed = Number.parseInt(totalGamesValue, 10);
          totalGames = Number.isNaN(parsed) ? null : parsed;
        }

        return {
          login,
          firstName,
          lastName,
          clubId,
          elo,
          totalGames,
        };
      })
      .catch(() => null);

    const profile: PlayerProfileSnapshot = {
      login: null,
      displayName: null,
      firstName: null,
      lastName: null,
      clubGomafiaId: null,
      eloRating: null,
      totalGames: null,
    };

    if (serverData) {
      profile.login = serverData.login;
      profile.firstName = serverData.firstName;
      profile.lastName = serverData.lastName;
      profile.clubGomafiaId = serverData.clubId;
      profile.eloRating = serverData.elo;
      profile.totalGames = serverData.totalGames;
    }

    // Attempt to capture a display name from DOM as part of the profile snapshot.
    profile.displayName = await extractPlayerNameFromDom(page);

    // If we failed to extract anything meaningful, return null so callers can handle fallback logic.
    if (
      !profile.login &&
      !profile.displayName &&
      !profile.firstName &&
      !profile.lastName &&
      profile.clubGomafiaId == null &&
      profile.eloRating == null &&
      profile.totalGames == null
    ) {
      return null;
    }

    return profile;
  } catch (error) {
    console.warn(`Failed to extract profile for player ${gomafiaId}:`, error);
    return null;
  }
}

async function extractPlayerNameFromDom(page: Page): Promise<string | null> {
  try {
    const nameFromProfileHeader = await page.$eval(
      'div[class*="profile-user__name"]',
      (element) => element.textContent?.trim() ?? null
    );
    if (nameFromProfileHeader && nameFromProfileHeader.trim()) {
      return nameFromProfileHeader.trim();
    }
  } catch {
    // Ignore DOM extraction errors.
  }

  // Fallback selectors – maintain legacy behaviour but deprioritized compared to specific class.
  const legacySelectors = [
    '.player-name',
    '[data-testid="player-name"]',
    '.stats-header h1',
    '.stats-header h2',
    'header h1',
    'header h2',
    'h1',
    'h2',
  ];

  for (const selector of legacySelectors) {
    try {
      const text = await page.$eval(
        selector,
        (element) => element.textContent?.trim() ?? null
      );
      if (text && text.trim()) {
        return text.trim();
      }
    } catch {
      // Continue trying other selectors
    }
  }

  try {
    const title = await page.title();
    if (title) {
      const match = title.match(/^(.+?)(?:\s*[-|]\s*Gomafia)?$/i);
      if (match && match[1]) {
        const candidate = match[1].trim();
        if (candidate) {
          return candidate;
        }
      }
    }
  } catch {
    // Ignore errors while reading page title
  }

  return null;
}

async function resolveClubId(
  clubGomafiaId: string | null
): Promise<string | null> {
  if (!clubGomafiaId) {
    return null;
  }

  try {
    const club = await resilientDB.execute((db) =>
      db.club.findUnique({
        where: { gomafiaId: clubGomafiaId },
        select: { id: true },
      })
    );

    return club?.id ?? null;
  } catch (error) {
    console.warn(
      `Failed to resolve club with gomafiaId ${clubGomafiaId}:`,
      error
    );
    return null;
  }
}

interface PlayerProfileSnapshot {
  login: string | null;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  clubGomafiaId: string | null;
  eloRating: number | null;
  totalGames: number | null;
}

/**
 * Sync a single tournament by gomafiaId
 */
async function syncTournament(
  tournamentId: string,
  options: {
    includeGames?: boolean;
  },
  browser: Browser,
  rateLimiter: RateLimiter
): Promise<ManualSyncResult<TournamentSyncData>> {
  try {
    const page = await browser.newPage();
    const detailScraper = new TournamentDetailScraper(page, rateLimiter);

    // Sync tournament detail (chief judge)
    const chiefJudge = await detailScraper.scrapeChiefJudge(tournamentId);

    let gamesData: TournamentGamesSummary | null = null;

    // Sync tournament games if requested
    if (options.includeGames) {
      await rateLimiter.wait();
      const gamesScraper = new TournamentGamesScraper(page);
      const games = await gamesScraper.scrapeGames(tournamentId);
      gamesData = {
        gamesFound: games.length,
        games: games,
      };
    }

    await page.close();

    return {
      success: true,
      message: `Successfully synced tournament ${tournamentId}`,
      entityId: tournamentId,
      data: {
        chiefJudge,
        games: gamesData,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Failed to sync tournament: ${errorMessage}`,
      errors: [errorMessage],
    };
  }
}

/**
 * Sync a single club by gomafiaId
 */
async function syncClub(
  clubId: string,
  options: {
    includeMembers?: boolean;
  },
  browser: Browser,
  rateLimiter: RateLimiter
): Promise<ManualSyncResult<ClubSyncData>> {
  try {
    const page = await browser.newPage();
    const detailScraper = new ClubDetailScraper(page, rateLimiter);

    let membersData: ClubSyncData['members'] = null;

    if (options.includeMembers) {
      const result = await detailScraper.scrapeMembersAndPresident(clubId);
      membersData = {
        membersFound: result.members.length,
        president: result.president,
        members: result.members,
      };
    }

    await page.close();

    return {
      success: true,
      message: `Successfully synced club ${clubId}`,
      entityId: clubId,
      data: {
        members: membersData,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Failed to sync club: ${errorMessage}`,
      errors: [errorMessage],
    };
  }
}

/**
 * Sync a single game by gomafiaId
 * Note: Games are typically synced as part of tournaments
 */
async function syncGame(
  _gameId: string,
  _browser: Browser,
  _rateLimiter: RateLimiter
): Promise<ManualSyncResult<null>> {
  // Games are typically accessed through tournament pages
  // This is a placeholder for future implementation
  return {
    success: false,
    message:
      'Game sync not yet implemented. Sync games through tournament sync.',
    errors: ['Not implemented'],
  };
}
