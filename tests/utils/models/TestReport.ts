import { TestExecution } from './TestExecution';

export interface TestSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  errorTests: number;
  passRate: number;
  executionTime: number;
  startTime: Date;
  endTime: Date;
}

export interface CoverageMetrics {
  lines: number;
  functions: number;
  branches: number;
  statements: number;
  overall: number;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  throughput: number;
  memoryUsage: number;
  cpuUsage: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
}

export interface SecurityMetrics {
  vulnerabilities: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  securityScore: number;
  complianceScore: number;
}

export interface Artifact {
  id: string;
  name: string;
  type:
    | 'screenshot'
    | 'video'
    | 'log'
    | 'report'
    | 'data'
    | 'coverage'
    | 'performance';
  format: string;
  size: number;
  location: string;
  description: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface Recommendation {
  id: string;
  category:
    | 'performance'
    | 'security'
    | 'coverage'
    | 'reliability'
    | 'maintainability';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  status: 'open' | 'in-progress' | 'resolved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface TestReport {
  id: string;
  executionId: string;
  name: string;
  type: 'execution' | 'coverage' | 'performance' | 'security' | 'compliance';
  status: 'generating' | 'completed' | 'failed';
  summary: TestSummary;
  coverage?: CoverageMetrics;
  performance?: PerformanceMetrics;
  security?: SecurityMetrics;
  recommendations: Recommendation[];
  artifacts: Artifact[];
  generatedAt: Date;
  generatedBy: string;
  testExecutions: TestExecution[];
}

export class TestReportManager {
  private reports: Map<string, TestReport> = new Map();

  createReport(
    reportData: Omit<
      TestReport,
      'id' | 'generatedAt' | 'recommendations' | 'artifacts' | 'testExecutions'
    >
  ): TestReport {
    const report: TestReport = {
      ...reportData,
      id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      generatedAt: new Date(),
      recommendations: [],
      artifacts: [],
      testExecutions: [],
    };

    this.reports.set(report.id, report);
    return report;
  }

  getReport(id: string): TestReport | undefined {
    return this.reports.get(id);
  }

  getAllReports(): TestReport[] {
    return Array.from(this.reports.values());
  }

  getReportsByType(type: TestReport['type']): TestReport[] {
    return this.getAllReports().filter((report) => report.type === type);
  }

  getReportsByStatus(status: TestReport['status']): TestReport[] {
    return this.getAllReports().filter((report) => report.status === status);
  }

  getReportsByExecutionId(executionId: string): TestReport[] {
    return this.getAllReports().filter(
      (report) => report.executionId === executionId
    );
  }

  updateReport(
    id: string,
    updates: Partial<Omit<TestReport, 'id' | 'generatedAt'>>
  ): TestReport | null {
    const report = this.reports.get(id);
    if (!report) {
      return null;
    }

    const updatedReport: TestReport = {
      ...report,
      ...updates,
    };

    this.reports.set(id, updatedReport);
    return updatedReport;
  }

  deleteReport(id: string): boolean {
    return this.reports.delete(id);
  }

  addRecommendation(
    reportId: string,
    recommendation: Omit<Recommendation, 'id' | 'createdAt' | 'updatedAt'>
  ): boolean {
    const report = this.reports.get(reportId);
    if (!report) {
      return false;
    }

    const newRecommendation: Recommendation = {
      ...recommendation,
      id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    report.recommendations.push(newRecommendation);
    this.reports.set(reportId, report);
    return true;
  }

  updateRecommendation(
    reportId: string,
    recommendationId: string,
    updates: Partial<Omit<Recommendation, 'id' | 'createdAt'>>
  ): boolean {
    const report = this.reports.get(reportId);
    if (!report) {
      return false;
    }

    const recommendationIndex = report.recommendations.findIndex(
      (rec) => rec.id === recommendationId
    );
    if (recommendationIndex === -1) {
      return false;
    }

    report.recommendations[recommendationIndex] = {
      ...report.recommendations[recommendationIndex],
      ...updates,
      updatedAt: new Date(),
    };

    this.reports.set(reportId, report);
    return true;
  }

  removeRecommendation(reportId: string, recommendationId: string): boolean {
    const report = this.reports.get(reportId);
    if (!report) {
      return false;
    }

    const initialLength = report.recommendations.length;
    report.recommendations = report.recommendations.filter(
      (rec) => rec.id !== recommendationId
    );

    if (report.recommendations.length < initialLength) {
      this.reports.set(reportId, report);
      return true;
    }

    return false;
  }

  addArtifact(
    reportId: string,
    artifact: Omit<Artifact, 'id' | 'createdAt'>
  ): boolean {
    const report = this.reports.get(reportId);
    if (!report) {
      return false;
    }

    const newArtifact: Artifact = {
      ...artifact,
      id: `artifact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };

    report.artifacts.push(newArtifact);
    this.reports.set(reportId, report);
    return true;
  }

  removeArtifact(reportId: string, artifactId: string): boolean {
    const report = this.reports.get(reportId);
    if (!report) {
      return false;
    }

    const initialLength = report.artifacts.length;
    report.artifacts = report.artifacts.filter((art) => art.id !== artifactId);

    if (report.artifacts.length < initialLength) {
      this.reports.set(reportId, report);
      return true;
    }

    return false;
  }

  addTestExecution(reportId: string, testExecution: TestExecution): boolean {
    const report = this.reports.get(reportId);
    if (!report) {
      return false;
    }

    report.testExecutions.push(testExecution);
    this.reports.set(reportId, report);
    return true;
  }

  removeTestExecution(reportId: string, testExecutionId: string): boolean {
    const report = this.reports.get(reportId);
    if (!report) {
      return false;
    }

    const initialLength = report.testExecutions.length;
    report.testExecutions = report.testExecutions.filter(
      (te) => te.id !== testExecutionId
    );

    if (report.testExecutions.length < initialLength) {
      this.reports.set(reportId, report);
      return true;
    }

    return false;
  }

  getReportStats(): {
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    averageRecommendations: number;
    averageArtifacts: number;
    averageTestExecutions: number;
  } {
    const reports = this.getAllReports();
    const total = reports.length;

    const byType = reports.reduce(
      (acc, report) => {
        acc[report.type] = (acc[report.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const byStatus = reports.reduce(
      (acc, report) => {
        acc[report.status] = (acc[report.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const averageRecommendations =
      total > 0
        ? reports.reduce(
            (sum, report) => sum + report.recommendations.length,
            0
          ) / total
        : 0;

    const averageArtifacts =
      total > 0
        ? reports.reduce((sum, report) => sum + report.artifacts.length, 0) /
          total
        : 0;

    const averageTestExecutions =
      total > 0
        ? reports.reduce(
            (sum, report) => sum + report.testExecutions.length,
            0
          ) / total
        : 0;

    return {
      total,
      byType,
      byStatus,
      averageRecommendations,
      averageArtifacts,
      averageTestExecutions,
    };
  }
}
