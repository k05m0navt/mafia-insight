import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  beforeEach,
  afterEach,
} from 'vitest';
import {
  parsePlayer,
  parseGame,
  parsePlayerList,
} from '@/lib/parsers/gomafiaParser';

const { mockPage, mockBrowser, chromiumLaunchMock } = vi.hoisted(() => {
  const page = {
    goto: vi.fn<[], Promise<void>>().mockResolvedValue(undefined),
    waitForSelector: vi.fn<[], Promise<void>>().mockResolvedValue(undefined),
    evaluate: vi.fn<[], Promise<unknown>>(),
    setExtraHTTPHeaders: vi
      .fn<[], Promise<void>>()
      .mockResolvedValue(undefined),
    setViewportSize: vi.fn<[], Promise<void>>().mockResolvedValue(undefined),
    close: vi.fn<[], Promise<void>>().mockResolvedValue(undefined),
  };

  const browser = {
    newPage: vi.fn<[], Promise<typeof page>>().mockResolvedValue(page),
    close: vi.fn<[], Promise<void>>().mockResolvedValue(undefined),
  };

  return {
    mockPage: page,
    mockBrowser: browser,
    chromiumLaunchMock: vi.fn().mockResolvedValue(browser),
  };
});

vi.mock('playwright', () => ({
  chromium: {
    launch: chromiumLaunchMock,
  },
}));

let parsePlayer: typeof import('@/lib/parsers/gomafiaParser').parsePlayer;
let parseGame: typeof import('@/lib/parsers/gomafiaParser').parseGame;
let parsePlayerList: typeof import('@/lib/parsers/gomafiaParser').parsePlayerList;

beforeAll(async () => {
  const module = await import('@/lib/parsers/gomafiaParser');
  parsePlayer = module.parsePlayer;
  parseGame = module.parseGame;
  parsePlayerList = module.parsePlayerList;
});

describe('gomafia parsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPage.goto.mockResolvedValue(undefined);
    mockPage.waitForSelector.mockResolvedValue(undefined);
    mockPage.evaluate.mockReset();
    mockPage.close.mockResolvedValue(undefined);
    mockBrowser.newPage.mockResolvedValue(mockPage);
    mockBrowser.close.mockResolvedValue(undefined);
    chromiumLaunchMock.mockResolvedValue(mockBrowser);
  });

  afterEach(() => {});

  describe('parsePlayer', () => {
    it('parses and validates player data', async () => {
      mockPage.evaluate.mockResolvedValue({
        id: 'player123',
        name: 'Test Player',
        eloRating: 1500,
        totalGames: 100,
        wins: 60,
        losses: 40,
        club: 'Test Club',
        lastActive: '2024-01-01',
      });

      const result = await parsePlayer('player123');

      expect(mockBrowser.newPage).toHaveBeenCalled();
      expect(mockPage.goto).toHaveBeenCalledWith(
        'https://gomafia.pro/player/player123',
        { waitUntil: 'networkidle' }
      );
      expect(mockPage.waitForSelector).toHaveBeenCalledWith('.player-info', {
        timeout: 10000,
      });
      expect(result.name).toBe('Test Player');
    });

    it('propagates permanent errors without retrying', async () => {
      mockPage.evaluate.mockRejectedValue(new Error('Player not found'));

      await expect(parsePlayer('missing')).rejects.toThrow('Player not found');
      expect(mockPage.goto).toHaveBeenCalledTimes(1);
    });
  });

  describe('parseGame', () => {
    it('parses game details with participants', async () => {
      mockPage.evaluate.mockResolvedValue({
        id: 'game-1',
        date: '2024-01-01T12:00:00Z',
        duration: 45,
        winnerTeam: 'BLACK',
        status: 'COMPLETED',
        participants: [
          { playerId: 'p1', role: 'MAFIA', team: 'BLACK' },
          { playerId: 'p2', role: 'CITIZEN', team: 'RED' },
        ],
      });

      const result = await parseGame('game-1');
      expect(mockPage.goto).toHaveBeenCalledWith(
        'https://gomafia.pro/game/game-1',
        { waitUntil: 'networkidle' }
      );
      expect(mockPage.waitForSelector).toHaveBeenCalledWith('.game-info', {
        timeout: 10000,
      });
      expect(result.participants).toHaveLength(2);
    });
  });

  describe('parsePlayerList', () => {
    it('parses player listings with pagination', async () => {
      mockPage.evaluate.mockResolvedValue([
        { id: 'p1', name: 'Player 1', eloRating: 1400 },
        { id: 'p2', name: 'Player 2', eloRating: 1500 },
      ]);

      const result = await parsePlayerList(2, 25);

      expect(mockPage.goto).toHaveBeenCalledWith(
        'https://gomafia.pro/players?page=2&limit=25',
        { waitUntil: 'networkidle' }
      );
      expect(mockPage.waitForSelector).toHaveBeenCalledWith('.players-list', {
        timeout: 10000,
      });
      expect(result).toHaveLength(2);
    });

    it('retries transient navigation failures', async () => {
      mockPage.goto
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue(undefined);
      mockPage.evaluate.mockResolvedValue([
        { id: 'p1', name: 'Player 1', eloRating: 1400 },
      ]);

      const result = await parsePlayerList(1, 10);

      expect(mockPage.goto).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(1);
    });
  });
});
