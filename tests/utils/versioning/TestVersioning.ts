export class TestVersioning {
  private version: string;
  private major: number;
  private minor: number;
  private patch: number;

  constructor(version: string) {
    this.version = version;
    const parts = version.split('.').map(Number);
    [this.major, this.minor, this.patch] = parts;
  }

  /**
   * Get full version string
   */
  getVersion(): string {
    return this.version;
  }

  /**
   * Get major version number
   */
  getMajor(): number {
    return this.major;
  }

  /**
   * Get minor version number
   */
  getMinor(): number {
    return this.minor;
  }

  /**
   * Get patch version number
   */
  getPatch(): number {
    return this.patch;
  }

  /**
   * Compare versions
   */
  compare(other: TestVersioning): number {
    if (this.major !== other.major) return this.major - other.major;
    if (this.minor !== other.minor) return this.minor - other.minor;
    return this.patch - other.patch;
  }

  /**
   * Check if version is greater than other
   */
  isGreaterThan(other: TestVersioning): boolean {
    return this.compare(other) > 0;
  }

  /**
   * Check if version is greater than or equal to other
   */
  isGreaterThanOrEqual(other: TestVersioning): boolean {
    return this.compare(other) >= 0;
  }

  /**
   * Check if version is less than other
   */
  isLessThan(other: TestVersioning): boolean {
    return this.compare(other) < 0;
  }

  /**
   * Check if version is less than or equal to other
   */
  isLessThanOrEqual(other: TestVersioning): boolean {
    return this.compare(other) <= 0;
  }

  /**
   * Check if version equals other
   */
  equals(other: TestVersioning): boolean {
    return this.compare(other) === 0;
  }

  /**
   * Increment major version
   */
  incrementMajor(): TestVersioning {
    return new TestVersioning(`${this.major + 1}.0.0`);
  }

  /**
   * Increment minor version
   */
  incrementMinor(): TestVersioning {
    return new TestVersioning(`${this.major}.${this.minor + 1}.0`);
  }

  /**
   * Increment patch version
   */
  incrementPatch(): TestVersioning {
    return new TestVersioning(`${this.major}.${this.minor}.${this.patch + 1}`);
  }

  /**
   * Parse version from string
   */
  static parse(version: string): TestVersioning {
    return new TestVersioning(version);
  }

  /**
   * Get current package version
   */
  static current(): TestVersioning {
    // In a real implementation, this would read from package.json
    return new TestVersioning('1.0.0');
  }
}
