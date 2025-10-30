/**
 * Cross-Browser Test Validator
 */

export interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

export class CrossBrowserValidator {
  /**
   * Validate feature support
   */
  static validateFeatureSupport(
    feature: string,
    supported: boolean,
    required: boolean
  ): ValidationResult {
    const result: ValidationResult = {
      passed: true,
      errors: [],
      warnings: [],
    };

    if (!supported && required) {
      result.passed = false;
      result.errors.push(`Required feature ${feature} is not supported`);
    } else if (!supported && !required) {
      result.warnings.push(`Optional feature ${feature} is not supported`);
    }

    return result;
  }

  /**
   * Validate browser version
   */
  static validateBrowserVersion(
    browser: string,
    version: string,
    minVersion: string
  ): ValidationResult {
    const result: ValidationResult = {
      passed: true,
      errors: [],
      warnings: [],
    };

    if (this.compareVersions(version, minVersion) < 0) {
      result.passed = false;
      result.errors.push(
        `${browser} version ${version} is below minimum ${minVersion}`
      );
    }

    return result;
  }

  /**
   * Compare version strings
   */
  private static compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;

      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }

    return 0;
  }

  /**
   * Validate viewport dimensions
   */
  static validateViewport(
    width: number,
    height: number,
    minWidth: number = 320,
    minHeight: number = 480
  ): ValidationResult {
    const result: ValidationResult = {
      passed: true,
      errors: [],
      warnings: [],
    };

    if (width < minWidth || height < minHeight) {
      result.warnings.push(
        `Viewport ${width}x${height} is below recommended minimum`
      );
    }

    return result;
  }
}
