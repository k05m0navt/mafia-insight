import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { parsePlayer, parseGame } from '@/lib/parsers/gomafiaParser';

// Mock Playwright
vi.mock('playwright', () => ({
  chromium: {
    launch: vi.fn().mockResolvedValue({
      newPage: vi.fn().mockResolvedValue({
        goto: vi.fn(),
        content: vi.fn(),
        close: vi.fn(),
      }),
      close: vi.fn(),
    }),
  },
}));

describe('Error Handling in Parser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle network errors gracefully', async () => {
    const mockPage = {
      goto: vi.fn().mockRejectedValue(new Error('Network error')),
      content: vi.fn(),
      close: vi.fn(),
    };

    const mockBrowser = {
      newPage: vi.fn().mockResolvedValue(mockPage),
      close: vi.fn(),
    };

    const { chromium } = await import('playwright');
    vi.mocked(chromium.launch).mockResolvedValue(mockBrowser as any);

    await expect(parsePlayer('invalid-id')).rejects.toThrow('Network error');
  });

  it('should handle malformed HTML gracefully', async () => {
    const mockPage = {
      goto: vi.fn().mockResolvedValue(undefined),
      content: vi
        .fn()
        .mockResolvedValue('<html><body>Invalid HTML structure</body></html>'),
      close: vi.fn(),
    };

    const mockBrowser = {
      newPage: vi.fn().mockResolvedValue(mockPage),
      close: vi.fn(),
    };

    const { chromium } = await import('playwright');
    vi.mocked(chromium.launch).mockResolvedValue(mockBrowser as any);

    await expect(parsePlayer('invalid-id')).rejects.toThrow(
      'Failed to parse player data'
    );
  });

  it('should handle missing data fields gracefully', async () => {
    const mockPage = {
      goto: vi.fn().mockResolvedValue(undefined),
      content: vi.fn().mockResolvedValue(`
        <html>
          <body>
            <div class="player-info">
              <h1>Player Name</h1>
              <!-- Missing ELO rating and game stats -->
            </div>
          </body>
        </html>
      `),
      close: vi.fn(),
    };

    const mockBrowser = {
      newPage: vi.fn().mockResolvedValue(mockPage),
      close: vi.fn(),
    };

    const { chromium } = await import('playwright');
    vi.mocked(chromium.launch).mockResolvedValue(mockBrowser as any);

    await expect(parsePlayer('incomplete-data')).rejects.toThrow(
      'Missing required player data'
    );
  });

  it('should handle timeout errors gracefully', async () => {
    const mockPage = {
      goto: vi
        .fn()
        .mockImplementation(
          () =>
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Timeout')), 100)
            )
        ),
      content: vi.fn(),
      close: vi.fn(),
    };

    const mockBrowser = {
      newPage: vi.fn().mockResolvedValue(mockPage),
      close: vi.fn(),
    };

    const { chromium } = await import('playwright');
    vi.mocked(chromium.launch).mockResolvedValue(mockBrowser as any);

    await expect(parsePlayer('timeout-id')).rejects.toThrow('Timeout');
  });

  it('should handle game parsing errors gracefully', async () => {
    const mockPage = {
      goto: vi.fn().mockResolvedValue(undefined),
      content: vi.fn().mockResolvedValue(`
        <html>
          <body>
            <div class="game-info">
              <!-- Missing game data -->
            </div>
          </body>
        </html>
      `),
      close: vi.fn(),
    };

    const mockBrowser = {
      newPage: vi.fn().mockResolvedValue(mockPage),
      close: vi.fn(),
    };

    const { chromium } = await import('playwright');
    vi.mocked(chromium.launch).mockResolvedValue(mockBrowser as any);

    await expect(parseGame('invalid-game-id')).rejects.toThrow(
      'Failed to parse game data'
    );
  });

  it('should retry on transient errors', async () => {
    let attemptCount = 0;
    const mockPage = {
      goto: vi.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary network error');
        }
        return Promise.resolve(undefined);
      }),
      content: vi.fn().mockResolvedValue(`
        <html>
          <body>
            <div class="player-info">
              <h1>Player Name</h1>
              <span class="elo">1500</span>
              <span class="games">10</span>
              <span class="wins">5</span>
              <span class="losses">5</span>
            </div>
          </body>
        </html>
      `),
      close: vi.fn(),
    };

    const mockBrowser = {
      newPage: vi.fn().mockResolvedValue(mockPage),
      close: vi.fn(),
    };

    const { chromium } = await import('playwright');
    vi.mocked(chromium.launch).mockResolvedValue(mockBrowser as any);

    const result = await parsePlayer('retry-test-id');
    expect(result).toBeDefined();
    expect(attemptCount).toBe(3);
  });
});
