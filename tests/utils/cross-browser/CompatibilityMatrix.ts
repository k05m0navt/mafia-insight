import browsersFixture from '../../fixtures/cross-browser/browsers.json';
import featuresFixture from '../../fixtures/cross-browser/features.json';

/**
 * Compatibility Matrix Generator
 */

interface FixtureStructure {
  desktop?: Record<string, unknown>;
  mobile?: Record<string, unknown>;
  css?: Record<string, unknown>;
  javascript?: Record<string, unknown>;
  webAPIs?: Record<string, unknown>;
}

export interface CompatibilityMatrix {
  browsers: string[];
  features: string[];
  matrix: Record<string, Record<string, boolean>>;
}

export class CompatibilityMatrixGenerator {
  /**
   * Generate compatibility matrix
   */
  static generate(): CompatibilityMatrix {
    const browsers = this.getSupportedBrowsers();
    const features = this.getSupportedFeatures();

    const matrix: Record<string, Record<string, boolean>> = {};

    for (const browser of browsers) {
      matrix[browser] = {};
      for (const feature of features) {
        matrix[browser][feature] = this.isFeatureSupported(browser, feature);
      }
    }

    return { browsers, features, matrix };
  }

  /**
   * Get supported browsers
   */
  private static getSupportedBrowsers(): string[] {
    const browsers = browsersFixture as FixtureStructure;
    return Object.keys({
      ...browsers.desktop,
      ...browsers.mobile,
    });
  }

  /**
   * Get supported features
   */
  private static getSupportedFeatures(): string[] {
    const features: string[] = [];
    const fixture = featuresFixture as FixtureStructure;

    // Add CSS features
    if (fixture.css) {
      features.push(...Object.keys(fixture.css));
    }

    // Add JavaScript features
    if (fixture.javascript) {
      features.push(...Object.keys(fixture.javascript));
    }

    // Add Web API features
    if (fixture.webAPIs) {
      features.push(...Object.keys(fixture.webAPIs));
    }

    return features;
  }

  /**
   * Check if a feature is supported by a browser
   */
  private static isFeatureSupported(
    _browser: string,
    _feature: string
  ): boolean {
    // Simplified logic - in real implementation would check actual browser version
    return true;
  }

  /**
   * Format matrix as table
   */
  static formatAsTable(matrix: CompatibilityMatrix): string {
    let table = 'Compatibility Matrix\n';
    table += '='.repeat(50) + '\n';

    // Header
    table += `Browser${' '.repeat(20)}| ${matrix.features.join(' | ')}\n`;
    table += '-'.repeat(50) + '\n';

    // Rows
    for (const browser of matrix.browsers) {
      const padding = 26 - browser.length;
      table += `${browser}${' '.repeat(padding)}|`;

      for (const feature of matrix.features) {
        const supported = matrix.matrix[browser][feature];
        table += ` ${supported ? '✓' : '✗'} |`;
      }

      table += '\n';
    }

    return table;
  }

  /**
   * Find incompatible combinations
   */
  static findIncompatible(matrix: CompatibilityMatrix): string[] {
    const incompatible: string[] = [];

    for (const browser of matrix.browsers) {
      for (const feature of matrix.features) {
        if (!matrix.matrix[browser][feature]) {
          incompatible.push(`${browser} + ${feature}`);
        }
      }
    }

    return incompatible;
  }
}
