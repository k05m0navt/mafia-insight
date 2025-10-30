/**
 * Cross-Browser Service
 */

export class CrossBrowserService {
  detectBrowser(): string {
    if (typeof window === 'undefined') return 'node';
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('chrome') && !ua.includes('edg')) return 'chrome';
    if (ua.includes('firefox')) return 'firefox';
    if (ua.includes('safari') && !ua.includes('chrome')) return 'safari';
    if (ua.includes('edg')) return 'edge';
    return 'unknown';
  }

  detectPlatform(): string {
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

  isFeatureSupported(feature: string): boolean {
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
      default:
        return false;
    }
  }
}

export const crossBrowserService = new CrossBrowserService();
