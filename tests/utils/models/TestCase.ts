import { TestStep, DataRequirement, EnvironmentConfig } from './TestExecution';

export interface TestCase {
  id: string;
  suiteId: string;
  name: string;
  description: string;
  type: 'automated' | 'manual' | 'hybrid';
  priority: 'critical' | 'high' | 'medium' | 'low';
  tags: string[];
  preconditions: string[];
  steps: TestStep[];
  expectedResults: string[];
  dataRequirements: DataRequirement[];
  environment: EnvironmentConfig;
  timeout: number;
  retryCount: number;
  status: 'draft' | 'ready' | 'active' | 'deprecated';
  createdAt: Date;
  updatedAt: Date;
}

export class TestCaseManager {
  private testCases: Map<string, TestCase> = new Map();

  createTestCase(
    testCaseData: Omit<TestCase, 'id' | 'createdAt' | 'updatedAt'>
  ): TestCase {
    const testCase: TestCase = {
      ...testCaseData,
      id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.testCases.set(testCase.id, testCase);
    return testCase;
  }

  getTestCase(id: string): TestCase | undefined {
    return this.testCases.get(id);
  }

  getAllTestCases(): TestCase[] {
    return Array.from(this.testCases.values());
  }

  getTestCasesBySuite(suiteId: string): TestCase[] {
    return this.getAllTestCases().filter((tc) => tc.suiteId === suiteId);
  }

  getTestCasesByType(type: TestCase['type']): TestCase[] {
    return this.getAllTestCases().filter((tc) => tc.type === type);
  }

  getTestCasesByPriority(priority: TestCase['priority']): TestCase[] {
    return this.getAllTestCases().filter((tc) => tc.priority === priority);
  }

  getTestCasesByStatus(status: TestCase['status']): TestCase[] {
    return this.getAllTestCases().filter((tc) => tc.status === status);
  }

  getTestCasesByTag(tag: string): TestCase[] {
    return this.getAllTestCases().filter((tc) => tc.tags.includes(tag));
  }

  updateTestCase(
    id: string,
    updates: Partial<Omit<TestCase, 'id' | 'createdAt'>>
  ): TestCase | null {
    const testCase = this.testCases.get(id);
    if (!testCase) {
      return null;
    }

    const updatedTestCase: TestCase = {
      ...testCase,
      ...updates,
      updatedAt: new Date(),
    };

    this.testCases.set(id, updatedTestCase);
    return updatedTestCase;
  }

  deleteTestCase(id: string): boolean {
    return this.testCases.delete(id);
  }

  addStep(testCaseId: string, step: TestStep): boolean {
    const testCase = this.testCases.get(testCaseId);
    if (!testCase) {
      return false;
    }

    testCase.steps.push(step);
    testCase.updatedAt = new Date();
    this.testCases.set(testCaseId, testCase);
    return true;
  }

  updateStep(
    testCaseId: string,
    stepNumber: number,
    updates: Partial<TestStep>
  ): boolean {
    const testCase = this.testCases.get(testCaseId);
    if (!testCase) {
      return false;
    }

    const stepIndex = testCase.steps.findIndex(
      (step) => step.stepNumber === stepNumber
    );
    if (stepIndex === -1) {
      return false;
    }

    testCase.steps[stepIndex] = { ...testCase.steps[stepIndex], ...updates };
    testCase.updatedAt = new Date();
    this.testCases.set(testCaseId, testCase);
    return true;
  }

  removeStep(testCaseId: string, stepNumber: number): boolean {
    const testCase = this.testCases.get(testCaseId);
    if (!testCase) {
      return false;
    }

    const initialLength = testCase.steps.length;
    testCase.steps = testCase.steps.filter(
      (step) => step.stepNumber !== stepNumber
    );

    if (testCase.steps.length < initialLength) {
      testCase.updatedAt = new Date();
      this.testCases.set(testCaseId, testCase);
      return true;
    }

    return false;
  }

  addTag(testCaseId: string, tag: string): boolean {
    const testCase = this.testCases.get(testCaseId);
    if (!testCase) {
      return false;
    }

    if (!testCase.tags.includes(tag)) {
      testCase.tags.push(tag);
      testCase.updatedAt = new Date();
      this.testCases.set(testCaseId, testCase);
    }
    return true;
  }

  removeTag(testCaseId: string, tag: string): boolean {
    const testCase = this.testCases.get(testCaseId);
    if (!testCase) {
      return false;
    }

    const initialLength = testCase.tags.length;
    testCase.tags = testCase.tags.filter((t) => t !== tag);

    if (testCase.tags.length < initialLength) {
      testCase.updatedAt = new Date();
      this.testCases.set(testCaseId, testCase);
      return true;
    }

    return false;
  }

  addPrecondition(testCaseId: string, precondition: string): boolean {
    const testCase = this.testCases.get(testCaseId);
    if (!testCase) {
      return false;
    }

    if (!testCase.preconditions.includes(precondition)) {
      testCase.preconditions.push(precondition);
      testCase.updatedAt = new Date();
      this.testCases.set(testCaseId, testCase);
    }
    return true;
  }

  removePrecondition(testCaseId: string, precondition: string): boolean {
    const testCase = this.testCases.get(testCaseId);
    if (!testCase) {
      return false;
    }

    const initialLength = testCase.preconditions.length;
    testCase.preconditions = testCase.preconditions.filter(
      (p) => p !== precondition
    );

    if (testCase.preconditions.length < initialLength) {
      testCase.updatedAt = new Date();
      this.testCases.set(testCaseId, testCase);
      return true;
    }

    return false;
  }

  addExpectedResult(testCaseId: string, expectedResult: string): boolean {
    const testCase = this.testCases.get(testCaseId);
    if (!testCase) {
      return false;
    }

    if (!testCase.expectedResults.includes(expectedResult)) {
      testCase.expectedResults.push(expectedResult);
      testCase.updatedAt = new Date();
      this.testCases.set(testCaseId, testCase);
    }
    return true;
  }

  removeExpectedResult(testCaseId: string, expectedResult: string): boolean {
    const testCase = this.testCases.get(testCaseId);
    if (!testCase) {
      return false;
    }

    const initialLength = testCase.expectedResults.length;
    testCase.expectedResults = testCase.expectedResults.filter(
      (er) => er !== expectedResult
    );

    if (testCase.expectedResults.length < initialLength) {
      testCase.updatedAt = new Date();
      this.testCases.set(testCaseId, testCase);
      return true;
    }

    return false;
  }

  getTestCaseStats(): {
    total: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
    byStatus: Record<string, number>;
    bySuite: Record<string, number>;
    averageSteps: number;
    averageTags: number;
  } {
    const testCases = this.getAllTestCases();
    const total = testCases.length;

    const byType = testCases.reduce(
      (acc, tc) => {
        acc[tc.type] = (acc[tc.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const byPriority = testCases.reduce(
      (acc, tc) => {
        acc[tc.priority] = (acc[tc.priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const byStatus = testCases.reduce(
      (acc, tc) => {
        acc[tc.status] = (acc[tc.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const bySuite = testCases.reduce(
      (acc, tc) => {
        acc[tc.suiteId] = (acc[tc.suiteId] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const averageSteps =
      total > 0
        ? testCases.reduce((sum, tc) => sum + tc.steps.length, 0) / total
        : 0;

    const averageTags =
      total > 0
        ? testCases.reduce((sum, tc) => sum + tc.tags.length, 0) / total
        : 0;

    return {
      total,
      byType,
      byPriority,
      byStatus,
      bySuite,
      averageSteps,
      averageTags,
    };
  }
}
