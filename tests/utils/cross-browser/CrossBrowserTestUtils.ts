/**
 * Cross-Browser Test Utilities
 */

import browsersFixture from '../../fixtures/cross-browser/browsers.json';

export function detectBrowser(): string {
  if (typeof window === 'undefined') return 'node';

  const ua = navigator.userAgent.toLowerCase();

  if (ua.includes('chrome') && !ua.includes('edg')) return 'chrome';
  if (ua.includes('firefox')) return 'firefox';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'safari';
  if (ua.includes('edg')) return 'edge';

  return 'unknown';
}

export function detectPlatform(): string {
  if (typeof window === 'undefined') return 'node';

  const ua = navigator.userAgent.toLowerCase();

  if (
    ua.includes('mobile') ||
    ua.includes('android') ||
    ua.includes('iphone')
  ) {
    return 'mobile';
  }

  return 'desktop';
}

export function isFeatureSupported(feature: string): boolean {
  if (typeof window === 'undefined') return false;

  switch (feature) {
    case 'webgl': {
      const canvas = document.createElement('canvas');
      const gl =
        canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    }

    case 'webrtc':
      return typeof RTCPeerConnection !== 'undefined';

    case 'serviceWorker':
      return 'serviceWorker' in navigator;

    case 'fetch':
      return typeof fetch !== 'undefined';

    case 'websocket':
      return typeof WebSocket !== 'undefined';

    case 'localStorage':
      return typeof Storage !== 'undefined';

    case 'sessionStorage':
      return typeof sessionStorage !== 'undefined';

    case 'indexedDB':
      return typeof indexedDB !== 'undefined';

    case 'cssGrid': {
      const grid = document.createElement('div');
      grid.style.display = 'grid';
      return grid.style.display === 'grid';
    }

    case 'flexbox': {
      const flex = document.createElement('div');
      flex.style.display = 'flex';
      return flex.style.display === 'flex';
    }

    case 'cssVariables': {
      const div = document.createElement('div');
      div.style.setProperty('--test-var', 'red');
      return div.style.getPropertyValue('--test-var') === 'red';
    }

    default:
      return false;
  }
}

export function getBrowserVersion(): string {
  const browser = detectBrowser();
  const ua = navigator.userAgent;

  if (browser === 'chrome') {
    const match = ua.match(/Chrome\/(\d+)/);
    return match ? match[1] : 'unknown';
  } else if (browser === 'firefox') {
    const match = ua.match(/Firefox\/(\d+)/);
    return match ? match[1] : 'unknown';
  } else if (browser === 'safari') {
    const match = ua.match(/Version\/(\d+\.\d+)/);
    return match ? match[1] : 'unknown';
  } else if (browser === 'edge') {
    const match = ua.match(/Edg\/(\d+)/);
    return match ? match[1] : 'unknown';
  }

  return 'unknown';
}

export function getBrowserInfo(): Record<string, string> {
  const browser = detectBrowser();
  const platform = detectPlatform();
  const version = getBrowserVersion();

  return {
    browser,
    platform,
    version,
    userAgent: navigator.userAgent,
  };
}

export function getExpectedFeatures(browser: string): string[] {
  const browsers = browsersFixture as {
    desktop?: Record<string, { features?: string[] }>;
    mobile?: Record<string, { features?: string[] }>;
  };

  const browserData =
    browsers.desktop?.[browser] ||
    browsers.mobile?.[`${browser}-android`] ||
    browsers.mobile?.[`${browser}-ios`];

  return browserData?.features || [];
}

export function checkFeatureCompatibility(
  features: string[]
): Record<string, boolean> {
  const result: Record<string, boolean> = {};

  for (const feature of features) {
    result[feature] = isFeatureSupported(feature);
  }

  return result;
}

export function getViewportSize(): { width: number; height: number } {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}
