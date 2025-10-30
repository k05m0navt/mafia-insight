export class PerformanceValidator {
  /**
   * Validate performance metrics
   */
  validateMetrics(metrics: PerformanceMetrics): ValidationResult {
    const issues: string[] = [];

    if (metrics.averageResponseTime > 2000) {
      issues.push(
        `Average response time too high: ${metrics.averageResponseTime}ms`
      );
    }

    if (metrics.p95ResponseTime > 5000) {
      issues.push(`P95 response time too high: ${metrics.p95ResponseTime}ms`);
    }

    if (metrics.p99ResponseTime > 10000) {
      issues.push(`P99 response time too high: ${metrics.p99ResponseTime}ms`);
    }

    if (metrics.throughput < 100) {
      issues.push(`Throughput too low: ${metrics.throughput} req/s`);
    }

    if (metrics.errorRate > 0.01) {
      issues.push(`Error rate too high: ${metrics.errorRate * 100}%`);
    }

    if (metrics.memoryUsage > 512) {
      issues.push(`Memory usage too high: ${metrics.memoryUsage}MB`);
    }

    return {
      valid: issues.length === 0,
      issues,
      score: this.calculateScore(metrics),
    };
  }

  /**
   * Validate Core Web Vitals
   */
  validateWebVitals(vitals: WebVitals): ValidationResult {
    const issues: string[] = [];

    if (vitals.lcp > 2500) {
      issues.push(`LCP too high: ${vitals.lcp}ms`);
    }

    if (vitals.fid > 100) {
      issues.push(`FID too high: ${vitals.fid}ms`);
    }

    if (vitals.cls > 0.1) {
      issues.push(`CLS too high: ${vitals.cls}`);
    }

    return {
      valid: issues.length === 0,
      issues,
      score: this.calculateWebVitalsScore(vitals),
    };
  }

  /**
   * Calculate performance score
   */
  private calculateScore(metrics: PerformanceMetrics): number {
    let score = 100;

    // Penalties for poor performance
    if (metrics.averageResponseTime > 2000) score -= 20;
    if (metrics.p95ResponseTime > 5000) score -= 20;
    if (metrics.errorRate > 0.01) score -= 30;
    if (metrics.memoryUsage > 512) score -= 30;

    return Math.max(0, score);
  }

  /**
   * Calculate Web Vitals score
   */
  private calculateWebVitalsScore(vitals: WebVitals): number {
    let score = 100;

    if (vitals.lcp > 2500) score -= 25;
    if (vitals.fid > 100) score -= 25;
    if (vitals.cls > 0.1) score -= 25;

    return Math.max(0, score);
  }
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number;
  errorRate: number;
  memoryUsage: number;
}

export interface WebVitals {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
}

export interface ValidationResult {
  valid: boolean;
  issues: string[];
  score: number;
}
