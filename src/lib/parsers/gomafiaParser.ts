import { chromium, Browser, Page } from 'playwright';
import { z } from 'zod';

// Validation schemas
const PlayerDataSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).max(50),
  eloRating: z.number().int().min(0).max(3000),
  totalGames: z.number().int().min(0),
  wins: z.number().int().min(0),
  losses: z.number().int().min(0),
  club: z.string().optional(),
  lastActive: z.string().optional(),
});

const GameDataSchema = z.object({
  id: z.string().min(1),
  date: z.string(),
  duration: z.number().int().positive().optional(),
  winnerTeam: z.enum(['BLACK', 'RED', 'DRAW']).optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  participants: z
    .array(
      z.object({
        playerId: z.string(),
        role: z.string(),
        team: z.enum(['BLACK', 'RED']),
      })
    )
    .optional(),
});

const PlayerListSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    eloRating: z.number().int().min(0).max(3000),
  })
);

export type PlayerData = z.infer<typeof PlayerDataSchema>;
export type GameData = z.infer<typeof GameDataSchema>;
export type PlayerListData = z.infer<typeof PlayerListSchema>;

// Configuration
const GOMAFIA_BASE_URL = process.env.GOMAFIA_BASE_URL || 'https://gomafia.pro';
const MAX_RETRIES = parseInt(process.env.SYNC_MAX_RETRIES || '5');
const RETRY_DELAY = parseInt(process.env.SYNC_RETRY_DELAY || '1000');

// Browser instance management
let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await chromium.launch({
      headless: process.env.NODE_ENV === 'production',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browser;
}

async function createPage(): Promise<Page> {
  const browserInstance = await getBrowser();
  const page = await browserInstance.newPage();

  // Set user agent to avoid detection
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  );

  // Set viewport
  await page.setViewportSize({ width: 1920, height: 1080 });

  return page;
}

async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

// Retry logic with exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  baseDelay: number = RETRY_DELAY
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on permanent errors
      if (isPermanentError(error as Error)) {
        throw error;
      }

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

function isPermanentError(error: Error): boolean {
  const permanentErrors = [
    'Player not found',
    'Game not found',
    'Invalid player data',
    'Invalid game data',
    'Authentication failed',
  ];

  return permanentErrors.some((msg) => error.message.includes(msg));
}

// Player parsing functions
export async function parsePlayer(playerId: string): Promise<PlayerData> {
  return withRetry(async () => {
    const page = await createPage();

    try {
      const url = `${GOMAFIA_BASE_URL}/player/${playerId}`;
      await page.goto(url, { waitUntil: 'networkidle' });

      // Wait for player info to load
      await page.waitForSelector('.player-info', { timeout: 10000 });

      const playerData = await page.evaluate(() => {
        const playerInfo = document.querySelector('.player-info');
        if (!playerInfo) throw new Error('Player info not found');

        const nameEl = playerInfo.querySelector('.player-name');
        const eloEl = playerInfo.querySelector('.player-elo');
        const gamesEl = playerInfo.querySelector('.player-games');
        const winsEl = playerInfo.querySelector('.player-wins');
        const lossesEl = playerInfo.querySelector('.player-losses');
        const clubEl = playerInfo.querySelector('.player-club');
        const lastActiveEl = playerInfo.querySelector('.player-last-active');

        if (!nameEl || !eloEl || !gamesEl || !winsEl || !lossesEl) {
          throw new Error('Required player data not found');
        }

        return {
          id: window.location.pathname.split('/').pop() || '',
          name: nameEl.textContent?.trim() || '',
          eloRating: parseInt(eloEl.textContent?.trim() || '0'),
          totalGames: parseInt(gamesEl.textContent?.trim() || '0'),
          wins: parseInt(winsEl.textContent?.trim() || '0'),
          losses: parseInt(lossesEl.textContent?.trim() || '0'),
          club: clubEl?.textContent?.trim() || undefined,
          lastActive: lastActiveEl?.textContent?.trim() || undefined,
        };
      });

      // Validate the parsed data
      const validatedData = PlayerDataSchema.parse(playerData);

      return validatedData;
    } finally {
      await page.close();
    }
  });
}

export async function parseGame(gameId: string): Promise<GameData> {
  return withRetry(async () => {
    const page = await createPage();

    try {
      const url = `${GOMAFIA_BASE_URL}/game/${gameId}`;
      await page.goto(url, { waitUntil: 'networkidle' });

      // Wait for game info to load
      await page.waitForSelector('.game-info', { timeout: 10000 });

      const gameData = await page.evaluate(() => {
        const gameInfo = document.querySelector('.game-info');
        if (!gameInfo) throw new Error('Game info not found');

        const dateEl = gameInfo.querySelector('.game-date');
        const durationEl = gameInfo.querySelector('.game-duration');
        const winnerEl = gameInfo.querySelector('.game-winner');
        const statusEl = gameInfo.querySelector('.game-status');
        const participantsEl = gameInfo.querySelector('.game-participants');

        if (!dateEl || !statusEl) {
          throw new Error('Required game data not found');
        }

        const participants = Array.from(
          participantsEl?.querySelectorAll('.participant') || []
        ).map((p) => {
          const playerIdEl = p.querySelector('.participant-id');
          const roleEl = p.querySelector('.participant-role');
          const teamEl = p.querySelector('.participant-team');

          return {
            playerId: playerIdEl?.textContent?.trim() || '',
            role: roleEl?.textContent?.trim() || '',
            team: teamEl?.textContent?.trim() || 'RED',
          };
        });

        return {
          id: window.location.pathname.split('/').pop() || '',
          date: dateEl.textContent?.trim() || '',
          duration: durationEl
            ? parseInt(durationEl.textContent?.trim() || '0')
            : undefined,
          winnerTeam: winnerEl?.textContent?.trim() as
            | 'BLACK'
            | 'RED'
            | 'DRAW'
            | undefined,
          status: statusEl.textContent?.trim() as
            | 'SCHEDULED'
            | 'IN_PROGRESS'
            | 'COMPLETED'
            | 'CANCELLED',
          participants: participants.length > 0 ? participants : undefined,
        };
      });

      // Validate the parsed data
      const validatedData = GameDataSchema.parse(gameData);

      return validatedData;
    } finally {
      await page.close();
    }
  });
}

export async function parsePlayerList(
  page: number = 1,
  limit: number = 50
): Promise<PlayerListData> {
  return withRetry(async () => {
    const pageInstance = await createPage();

    try {
      const url = `${GOMAFIA_BASE_URL}/players?page=${page}&limit=${limit}`;
      await pageInstance.goto(url, { waitUntil: 'networkidle' });

      // Wait for players list to load
      await pageInstance.waitForSelector('.players-list', { timeout: 10000 });

      const playerList = await pageInstance.evaluate(() => {
        const playersList = document.querySelector('.players-list');
        if (!playersList) throw new Error('Players list not found');

        const playerElements = playersList.querySelectorAll('.player-item');

        return Array.from(playerElements).map((playerEl) => {
          const idEl = playerEl.querySelector('.player-id');
          const nameEl = playerEl.querySelector('.player-name');
          const eloEl = playerEl.querySelector('.player-elo');

          if (!idEl || !nameEl || !eloEl) {
            throw new Error('Required player list data not found');
          }

          return {
            id: idEl.textContent?.trim() || '',
            name: nameEl.textContent?.trim() || '',
            eloRating: parseInt(eloEl.textContent?.trim() || '0'),
          };
        });
      });

      // Validate the parsed data
      const validatedData = PlayerListSchema.parse(playerList);

      return validatedData;
    } finally {
      await pageInstance.close();
    }
  });
}

// Cleanup function for graceful shutdown
export async function cleanup(): Promise<void> {
  await closeBrowser();
}

// Handle process termination
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
