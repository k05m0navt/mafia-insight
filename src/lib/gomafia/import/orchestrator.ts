import { prisma } from '@/lib/db';
import { ImportStatus, ImportProgress } from '@/types/importProgress';

export class ImportOrchestrator {
  private static instance: ImportOrchestrator;
  private activeImports: Map<string, ImportProgress> = new Map();

  private constructor() {}

  public static getInstance(): ImportOrchestrator {
    if (!ImportOrchestrator.instance) {
      ImportOrchestrator.instance = new ImportOrchestrator();
    }
    return ImportOrchestrator.instance;
  }

  public async startImport(
    operation: string,
    totalRecords: number
  ): Promise<string> {
    const importId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const importProgress: ImportProgress = {
      id: importId,
      operation,
      progress: 0,
      totalRecords,
      processedRecords: 0,
      errors: 0,
      startTime: new Date(),
      status: 'PENDING',
    };

    // Save to database
    await prisma.importProgress.create({
      data: {
        id: importId,
        operation,
        progress: 0,
        totalRecords,
        processedRecords: 0,
        errors: 0,
        startTime: new Date(),
        status: 'PENDING',
      },
    });

    this.activeImports.set(importId, importProgress);
    return importId;
  }

  public async updateProgress(
    importId: string,
    processedRecords: number,
    errors: number = 0
  ): Promise<void> {
    const importProgress = this.activeImports.get(importId);
    if (!importProgress) {
      throw new Error(`Import ${importId} not found`);
    }

    const progress = Math.min(
      100,
      Math.round((processedRecords / importProgress.totalRecords) * 100)
    );

    importProgress.progress = progress;
    importProgress.processedRecords = processedRecords;
    importProgress.errors = errors;
    importProgress.status = 'RUNNING';

    // Update database
    await prisma.importProgress.update({
      where: { id: importId },
      data: {
        progress,
        processedRecords,
        errors,
        status: 'RUNNING',
      },
    });

    // Notify subscribers (in a real implementation, this would use WebSockets or SSE)
    this.notifyProgress(importProgress);
  }

  public async completeImport(importId: string): Promise<void> {
    const importProgress = this.activeImports.get(importId);
    if (!importProgress) {
      throw new Error(`Import ${importId} not found`);
    }

    importProgress.progress = 100;
    importProgress.status = 'COMPLETED';

    // Update database
    await prisma.importProgress.update({
      where: { id: importId },
      data: {
        progress: 100,
        status: 'COMPLETED',
      },
    });

    // Notify subscribers
    this.notifyProgress(importProgress);

    // Clean up
    this.activeImports.delete(importId);
  }

  public async failImport(importId: string): Promise<void> {
    const importProgress = this.activeImports.get(importId);
    if (!importProgress) {
      throw new Error(`Import ${importId} not found`);
    }

    importProgress.status = 'FAILED';

    // Update database
    await prisma.importProgress.update({
      where: { id: importId },
      data: {
        status: 'FAILED',
      },
    });

    // Notify subscribers
    this.notifyProgress(importProgress);

    // Clean up
    this.activeImports.delete(importId);
  }

  public async cancelImport(importId: string): Promise<void> {
    const importProgress = this.activeImports.get(importId);
    if (!importProgress) {
      throw new Error(`Import ${importId} not found`);
    }

    importProgress.status = 'CANCELLED';

    // Update database
    await prisma.importProgress.update({
      where: { id: importId },
      data: {
        status: 'CANCELLED',
      },
    });

    // Notify subscribers
    this.notifyProgress(importProgress);

    // Clean up
    this.activeImports.delete(importId);
  }

  public getActiveImports(): ImportProgress[] {
    return Array.from(this.activeImports.values());
  }

  public getImport(importId: string): ImportProgress | undefined {
    return this.activeImports.get(importId);
  }

  private notifyProgress(importProgress: ImportProgress): void {
    // Enhanced logging with readable format
    const statusEmoji =
      {
        PENDING: '⏳',
        RUNNING: '🔄',
        COMPLETED: '✅',
        FAILED: '❌',
        CANCELLED: '⏸️',
      }[importProgress.status] || '❓';

    const duration = importProgress.startTime
      ? Math.round(
          (Date.now() - new Date(importProgress.startTime).getTime()) / 1000
        )
      : 0;
    const durationStr =
      duration > 60
        ? `${Math.floor(duration / 60)}m ${duration % 60}s`
        : `${duration}s`;

    console.log(
      `\n${statusEmoji} [IMPORT] ${importProgress.operation}`,
      `\n   ID: ${importProgress.id}`,
      `\n   Progress: ${importProgress.progress}% (${importProgress.processedRecords}/${importProgress.totalRecords} records)`,
      `\n   Status: ${importProgress.status}`,
      `\n   Errors: ${importProgress.errors}`,
      `\n   Duration: ${durationStr}`,
      importProgress.estimatedCompletion
        ? `\n   ETA: ${new Date(importProgress.estimatedCompletion).toLocaleTimeString()}`
        : ''
    );
  }

  public async getImportHistory(limit: number = 10): Promise<ImportProgress[]> {
    const imports = await prisma.importProgress.findMany({
      orderBy: {
        startTime: 'desc',
      },
      take: limit,
    });

    return imports.map((imp) => ({
      id: imp.id,
      operation: imp.operation,
      progress: imp.progress,
      totalRecords: imp.totalRecords,
      processedRecords: imp.processedRecords,
      errors: imp.errors,
      startTime: imp.startTime,
      estimatedCompletion: imp.estimatedCompletion || undefined,
      status: imp.status as ImportStatus,
    }));
  }
}

// Export singleton instance
export const importOrchestrator = ImportOrchestrator.getInstance();
