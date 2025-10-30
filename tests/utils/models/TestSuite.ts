import { TestCase } from './TestExecution';

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  category: 'unit' | 'integration' | 'e2e' | 'performance' | 'security';
  priority: 'P1' | 'P2' | 'P3';
  userStoryId?: string;
  status: 'draft' | 'active' | 'deprecated';
  createdAt: Date;
  updatedAt: Date;
  lastRunAt?: Date;
  passRate: number;
  testCases: TestCase[];
}

export class TestSuiteManager {
  private suites: Map<string, TestSuite> = new Map();

  createSuite(
    suiteData: Omit<
      TestSuite,
      'id' | 'createdAt' | 'updatedAt' | 'passRate' | 'testCases'
    >
  ): TestSuite {
    const suite: TestSuite = {
      ...suiteData,
      id: `suite-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      passRate: 0,
      testCases: [],
    };

    this.suites.set(suite.id, suite);
    return suite;
  }

  getSuite(id: string): TestSuite | undefined {
    return this.suites.get(id);
  }

  getAllSuites(): TestSuite[] {
    return Array.from(this.suites.values());
  }

  getSuitesByCategory(category: TestSuite['category']): TestSuite[] {
    return this.getAllSuites().filter((suite) => suite.category === category);
  }

  getSuitesByPriority(priority: TestSuite['priority']): TestSuite[] {
    return this.getAllSuites().filter((suite) => suite.priority === priority);
  }

  getSuitesByUserStory(userStoryId: string): TestSuite[] {
    return this.getAllSuites().filter(
      (suite) => suite.userStoryId === userStoryId
    );
  }

  updateSuite(
    id: string,
    updates: Partial<Omit<TestSuite, 'id' | 'createdAt'>>
  ): TestSuite | null {
    const suite = this.suites.get(id);
    if (!suite) {
      return null;
    }

    const updatedSuite: TestSuite = {
      ...suite,
      ...updates,
      updatedAt: new Date(),
    };

    this.suites.set(id, updatedSuite);
    return updatedSuite;
  }

  deleteSuite(id: string): boolean {
    return this.suites.delete(id);
  }

  addTestCase(suiteId: string, testCase: TestCase): boolean {
    const suite = this.suites.get(suiteId);
    if (!suite) {
      return false;
    }

    suite.testCases.push(testCase);
    suite.updatedAt = new Date();
    this.suites.set(suiteId, suite);
    return true;
  }

  removeTestCase(suiteId: string, testCaseId: string): boolean {
    const suite = this.suites.get(suiteId);
    if (!suite) {
      return false;
    }

    const initialLength = suite.testCases.length;
    suite.testCases = suite.testCases.filter((tc) => tc.id !== testCaseId);

    if (suite.testCases.length < initialLength) {
      suite.updatedAt = new Date();
      this.suites.set(suiteId, suite);
      return true;
    }

    return false;
  }

  updatePassRate(suiteId: string, passRate: number): boolean {
    const suite = this.suites.get(suiteId);
    if (!suite) {
      return false;
    }

    suite.passRate = Math.max(0, Math.min(100, passRate));
    suite.updatedAt = new Date();
    this.suites.set(suiteId, suite);
    return true;
  }

  updateLastRun(suiteId: string, lastRunAt: Date): boolean {
    const suite = this.suites.get(suiteId);
    if (!suite) {
      return false;
    }

    suite.lastRunAt = lastRunAt;
    suite.updatedAt = new Date();
    this.suites.set(suiteId, suite);
    return true;
  }

  getSuiteStats(): {
    total: number;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
    byStatus: Record<string, number>;
    averagePassRate: number;
  } {
    const suites = this.getAllSuites();
    const total = suites.length;

    const byCategory = suites.reduce(
      (acc, suite) => {
        acc[suite.category] = (acc[suite.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const byPriority = suites.reduce(
      (acc, suite) => {
        acc[suite.priority] = (acc[suite.priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const byStatus = suites.reduce(
      (acc, suite) => {
        acc[suite.status] = (acc[suite.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const averagePassRate =
      total > 0
        ? suites.reduce((sum, suite) => sum + suite.passRate, 0) / total
        : 0;

    return {
      total,
      byCategory,
      byPriority,
      byStatus,
      averagePassRate,
    };
  }
}
