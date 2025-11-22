import { describe, it, expect, afterEach, vi } from 'vitest';
import { crossBrowserService } from '@/services/CrossBrowserService';

type NavigatorWithUA = Navigator & { userAgent: string };

const originalUserAgent = (navigator as NavigatorWithUA).userAgent;
const originalCreateElement = document.createElement.bind(document);

function setUserAgent(value: string) {
  Object.defineProperty(window.navigator, 'userAgent', {
    value,
    configurable: true,
  });
}

afterEach(() => {
  setUserAgent(originalUserAgent);
  vi.restoreAllMocks();
});

describe('CrossBrowserService', () => {
  describe('detectBrowser', () => {
    it('returns "node" when executed without window context', () => {
      const originalWindow = globalThis.window;
      // @ts-expect-error - intentionally removing window
      delete (globalThis as any).window;

      expect(crossBrowserService.detectBrowser()).toBe('node');

      (globalThis as any).window = originalWindow;
    });

    it('detects Chrome user agents', () => {
      setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
      );

      expect(crossBrowserService.detectBrowser()).toBe('chrome');
    });

    it('detects Firefox user agents', () => {
      setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:115.0) Gecko/20100101 Firefox/115.0'
      );

      expect(crossBrowserService.detectBrowser()).toBe('firefox');
    });

    it('detects Safari user agents', () => {
      setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
      );

      expect(crossBrowserService.detectBrowser()).toBe('safari');
    });

    it('detects Edge user agents', () => {
      setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 Edg/117.0.2045.47'
      );

      expect(crossBrowserService.detectBrowser()).toBe('edge');
    });
  });

  describe('detectPlatform', () => {
    it('reports mobile when user agent includes mobile identifiers', () => {
      setUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
      );

      expect(crossBrowserService.detectPlatform()).toBe('mobile');
    });

    it('reports desktop otherwise', () => {
      setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
      );

      expect(crossBrowserService.detectPlatform()).toBe('desktop');
    });
  });

  describe('isFeatureSupported', () => {
    it('detects WebGL support via canvas context', () => {
      vi.spyOn(document, 'createElement').mockImplementation(
        (tagName: string) => {
          if (tagName === 'canvas') {
            return {
              getContext: vi.fn().mockReturnValue({}),
            } as unknown as HTMLElement;
          }
          return originalCreateElement(tagName);
        }
      );

      expect(crossBrowserService.isFeatureSupported('webgl')).toBe(true);
    });

    it('detects Fetch API support', () => {
      expect(crossBrowserService.isFeatureSupported('fetch')).toBe(true);
    });

    it('returns false for unknown features', () => {
      expect(crossBrowserService.isFeatureSupported('unknown-feature')).toBe(
        false
      );
    });
  });
});
