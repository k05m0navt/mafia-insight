export interface TestData {
  id: string;
  name: string;
  description: string;
  type: 'anonymized' | 'synthetic' | 'edge-case' | 'production';
  category: string;
  size: number;
  format: 'json' | 'csv' | 'sql' | 'xml';
  location: string;
  anonymizationLevel: 'none' | 'partial' | 'full';
  privacyCompliance: string[];
  version: string;
  checksum: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export class TestDataManager {
  private testData: Map<string, TestData> = new Map();

  createTestData(
    data: Omit<TestData, 'id' | 'createdAt' | 'updatedAt' | 'checksum'>
  ): TestData {
    const testData: TestData = {
      ...data,
      id: `data-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      checksum: this.generateChecksum(data),
    };

    this.testData.set(testData.id, testData);
    return testData;
  }

  getTestData(id: string): TestData | undefined {
    return this.testData.get(id);
  }

  getAllTestData(): TestData[] {
    return Array.from(this.testData.values());
  }

  getTestDataByType(type: TestData['type']): TestData[] {
    return this.getAllTestData().filter((td) => td.type === type);
  }

  getTestDataByCategory(category: string): TestData[] {
    return this.getAllTestData().filter((td) => td.category === category);
  }

  getTestDataByFormat(format: TestData['format']): TestData[] {
    return this.getAllTestData().filter((td) => td.format === format);
  }

  getTestDataByAnonymizationLevel(
    level: TestData['anonymizationLevel']
  ): TestData[] {
    return this.getAllTestData().filter(
      (td) => td.anonymizationLevel === level
    );
  }

  getTestDataByCompliance(compliance: string): TestData[] {
    return this.getAllTestData().filter((td) =>
      td.privacyCompliance.includes(compliance)
    );
  }

  updateTestData(
    id: string,
    updates: Partial<Omit<TestData, 'id' | 'createdAt'>>
  ): TestData | null {
    const testData = this.testData.get(id);
    if (!testData) {
      return null;
    }

    const updatedTestData: TestData = {
      ...testData,
      ...updates,
      updatedAt: new Date(),
      checksum: this.generateChecksum({ ...testData, ...updates }),
    };

    this.testData.set(id, updatedTestData);
    return updatedTestData;
  }

  deleteTestData(id: string): boolean {
    return this.testData.delete(id);
  }

  addCompliance(id: string, compliance: string): boolean {
    const testData = this.testData.get(id);
    if (!testData) {
      return false;
    }

    if (!testData.privacyCompliance.includes(compliance)) {
      testData.privacyCompliance.push(compliance);
      testData.updatedAt = new Date();
      this.testData.set(id, testData);
    }
    return true;
  }

  removeCompliance(id: string, compliance: string): boolean {
    const testData = this.testData.get(id);
    if (!testData) {
      return false;
    }

    const initialLength = testData.privacyCompliance.length;
    testData.privacyCompliance = testData.privacyCompliance.filter(
      (c) => c !== compliance
    );

    if (testData.privacyCompliance.length < initialLength) {
      testData.updatedAt = new Date();
      this.testData.set(id, testData);
      return true;
    }

    return false;
  }

  setExpiration(id: string, expiresAt: Date): boolean {
    const testData = this.testData.get(id);
    if (!testData) {
      return false;
    }

    testData.expiresAt = expiresAt;
    testData.updatedAt = new Date();
    this.testData.set(id, testData);
    return true;
  }

  removeExpiration(id: string): boolean {
    const testData = this.testData.get(id);
    if (!testData) {
      return false;
    }

    delete testData.expiresAt;
    testData.updatedAt = new Date();
    this.testData.set(id, testData);
    return true;
  }

  getExpiredData(): TestData[] {
    const now = new Date();
    return this.getAllTestData().filter(
      (td) => td.expiresAt && td.expiresAt < now
    );
  }

  getExpiringSoon(days: number = 7): TestData[] {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.getAllTestData().filter(
      (td) =>
        td.expiresAt && td.expiresAt <= futureDate && td.expiresAt > new Date()
    );
  }

  validateChecksum(id: string): boolean {
    const testData = this.testData.get(id);
    if (!testData) {
      return false;
    }

    const expectedChecksum = this.generateChecksum(testData);
    return testData.checksum === expectedChecksum;
  }

  private generateChecksum(data: Partial<TestData>): string {
    // Simple checksum generation - in production, use a proper hash function
    const content = JSON.stringify({
      name: data.name,
      type: data.type,
      category: data.category,
      size: data.size,
      format: data.format,
      location: data.location,
      anonymizationLevel: data.anonymizationLevel,
      privacyCompliance: data.privacyCompliance,
      version: data.version,
    });

    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(16);
  }

  getTestDataStats(): {
    total: number;
    byType: Record<string, number>;
    byCategory: Record<string, number>;
    byFormat: Record<string, number>;
    byAnonymizationLevel: Record<string, number>;
    totalSize: number;
    averageSize: number;
    expiredCount: number;
    expiringSoonCount: number;
  } {
    const allData = this.getAllTestData();
    const total = allData.length;

    const byType = allData.reduce(
      (acc, td) => {
        acc[td.type] = (acc[td.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const byCategory = allData.reduce(
      (acc, td) => {
        acc[td.category] = (acc[td.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const byFormat = allData.reduce(
      (acc, td) => {
        acc[td.format] = (acc[td.format] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const byAnonymizationLevel = allData.reduce(
      (acc, td) => {
        acc[td.anonymizationLevel] = (acc[td.anonymizationLevel] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const totalSize = allData.reduce((sum, td) => sum + td.size, 0);
    const averageSize = total > 0 ? totalSize / total : 0;
    const expiredCount = this.getExpiredData().length;
    const expiringSoonCount = this.getExpiringSoon().length;

    return {
      total,
      byType,
      byCategory,
      byFormat,
      byAnonymizationLevel,
      totalSize,
      averageSize,
      expiredCount,
      expiringSoonCount,
    };
  }
}
