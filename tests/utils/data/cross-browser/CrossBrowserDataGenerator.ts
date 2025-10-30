/**
 * Cross-Browser Test Data Generator
 */

export interface BrowserTestData {
  browser: string;
  platform: string;
  viewport: { width: number; height: number };
  userAgent: string;
  features: Record<string, boolean>;
}

export class CrossBrowserDataGenerator {
  /**
   * Generate test data for a specific browser
   */
  static generateBrowserData(
    browser: string,
    platform: string = 'desktop'
  ): BrowserTestData {
    const viewport = this.getViewportForPlatform(platform);
    const userAgent = this.generateUserAgent(browser, platform);

    return {
      browser,
      platform,
      viewport,
      userAgent,
      features: {},
    };
  }

  /**
   * Get viewport size based on platform
   */
  private static getViewportForPlatform(platform: string): {
    width: number;
    height: number;
  } {
    const viewports: Record<string, { width: number; height: number }> = {
      desktop: { width: 1920, height: 1080 },
      tablet: { width: 768, height: 1024 },
      mobile: { width: 375, height: 667 },
    };

    return viewports[platform] || viewports.desktop;
  }

  /**
   * Generate user agent string
   */
  private static generateUserAgent(browser: string, platform: string): string {
    const agents: Record<string, Record<string, string>> = {
      chrome: {
        desktop:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        mobile:
          'Mozilla/5.0 (Linux; Android 13; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      },
      firefox: {
        desktop:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
        mobile:
          'Mozilla/5.0 (Android 13; Mobile; rv:121.0) Gecko/121.0 Firefox/121.0',
      },
      safari: {
        desktop:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        mobile:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      },
      edge: {
        desktop:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
        mobile:
          'Mozilla/5.0 (Linux; Android 13; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 Edg/120.0.0.0',
      },
    };

    return agents[browser]?.[platform] || agents.chrome.desktop;
  }

  /**
   * Generate browser compatibility matrix
   */
  static generateCompatibilityMatrix(): {
    browsers: string[];
    platforms: string[];
    features: string[];
  } {
    return {
      browsers: ['chrome', 'firefox', 'safari', 'edge'],
      platforms: ['desktop', 'mobile'],
      features: ['webgl', 'webrtc', 'serviceWorker', 'fetch', 'websocket'],
    };
  }
}
