import { monitoringService } from '../monitoring';

export interface ExportOptions {
  format: 'json' | 'csv' | 'xlsx';
  includeMetadata?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ExportProgress {
  stage: string;
  progress: number;
  total: number;
  current: number;
}

export class DataExporter {
  private progressCallback?: (progress: ExportProgress) => void;

  constructor(progressCallback?: (progress: ExportProgress) => void) {
    this.progressCallback = progressCallback;
  }

  // Export player data
  async exportPlayerData(
    playerId: string,
    options: ExportOptions
  ): Promise<Blob> {
    return monitoringService.measureAsync('export_player_data', async () => {
      this.updateProgress('Fetching player data...', 0, 100, 0);

      // Fetch player data
      const response = await fetch(`/api/players/${playerId}/export`);
      if (!response.ok) {
        throw new Error('Failed to fetch player data');
      }

      const data = await response.json();
      this.updateProgress('Processing data...', 25, 100, 25);

      // Process data based on format
      let processedData: unknown;
      let mimeType: string;

      switch (options.format) {
        case 'json':
          processedData = this.exportToJSON(data, options);
          mimeType = 'application/json';
          break;
        case 'csv':
          processedData = this.exportToCSV(data);
          mimeType = 'text/csv';
          break;
        case 'xlsx':
          processedData = await this.exportToXLSX(data, options);
          mimeType =
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          // _filename = `player-${playerId}-${Date.now()}.xlsx`;
          break;
        default:
          throw new Error('Unsupported export format');
      }

      this.updateProgress('Generating file...', 75, 100, 75);

      const blob = new Blob([processedData as BlobPart], { type: mimeType });
      this.updateProgress('Export complete', 100, 100, 100);

      return blob;
    });
  }

  // Export analytics data
  async exportAnalytics(
    entityType: 'player' | 'club' | 'tournament',
    entityId: string,
    options: ExportOptions
  ): Promise<Blob> {
    return monitoringService.measureAsync('export_analytics', async () => {
      this.updateProgress('Fetching analytics data...', 0, 100, 0);

      const response = await fetch(
        `/api/analytics/${entityType}/${entityId}/export`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const data = await response.json();
      this.updateProgress('Processing analytics...', 50, 100, 50);

      let processedData: unknown;
      let mimeType: string;

      switch (options.format) {
        case 'json':
          processedData = this.exportToJSON(data, options);
          mimeType = 'application/json';
          break;
        case 'csv':
          processedData = this.exportToCSV(data);
          mimeType = 'text/csv';
          break;
        case 'xlsx':
          processedData = await this.exportToXLSX(data, options);
          mimeType =
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          // _filename = `analytics-${entityType}-${entityId}-${Date.now()}.xlsx`;
          break;
        default:
          throw new Error('Unsupported export format');
      }

      this.updateProgress('Generating file...', 90, 100, 90);

      const blob = new Blob([processedData as BlobPart], { type: mimeType });
      this.updateProgress('Export complete', 100, 100, 100);

      return blob;
    });
  }

  // Export to JSON
  private exportToJSON(data: unknown, options: ExportOptions): string {
    const exportData = {
      ...(data as Record<string, unknown>),
      ...(options.includeMetadata && {
        metadata: {
          exportedAt: new Date().toISOString(),
          format: 'json',
          version: '1.0',
        },
      }),
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Export to CSV
  private exportToCSV(data: unknown): string {
    if (Array.isArray(data)) {
      return this.arrayToCSV(data);
    }

    // Flatten nested objects for CSV
    const flattened = this.flattenObject(data as Record<string, unknown>);
    return this.objectToCSV(flattened);
  }

  // Export to XLSX
  private async exportToXLSX(
    data: unknown,
    options: ExportOptions
  ): Promise<ArrayBuffer> {
    // This would require a library like 'xlsx' or 'exceljs'
    // For now, return a simple implementation
    const jsonData = this.exportToJSON(data, options);
    const encoded = new TextEncoder().encode(jsonData);
    return encoded.buffer;
  }

  // Convert array to CSV
  private arrayToCSV(data: unknown[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0] as Record<string, unknown>);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map((header) => {
        const value = (row as Record<string, unknown>)[header];
        return typeof value === 'string'
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  // Convert object to CSV
  private objectToCSV(data: Record<string, unknown>): string {
    const rows: string[] = [];

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'object' && value !== null) {
        rows.push(`${key},${JSON.stringify(value)}`);
      } else {
        rows.push(`${key},"${value}"`);
      }
    }

    return ['Key,Value', ...rows].join('\n');
  }

  // Flatten nested objects
  private flattenObject(
    obj: Record<string, unknown>,
    prefix = ''
  ): Record<string, unknown> {
    const flattened: Record<string, unknown> = {};

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const newKey = prefix ? `${prefix}.${key}` : key;

        if (
          typeof obj[key] === 'object' &&
          obj[key] !== null &&
          !Array.isArray(obj[key])
        ) {
          Object.assign(
            flattened,
            this.flattenObject(obj[key] as Record<string, unknown>, newKey)
          );
        } else {
          flattened[newKey] = obj[key];
        }
      }
    }

    return flattened;
  }

  // Update progress
  private updateProgress(
    stage: string,
    progress: number,
    total: number,
    current: number
  ): void {
    if (this.progressCallback) {
      this.progressCallback({
        stage,
        progress,
        total,
        current,
      });
    }
  }

  // Download file
  static downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Utility functions
export const exportUtils = {
  // Export player data with progress
  async exportPlayerWithProgress(
    playerId: string,
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<void> {
    const exporter = new DataExporter(onProgress);
    const blob = await exporter.exportPlayerData(playerId, options);
    const filename = `player-${playerId}-${Date.now()}.${options.format}`;
    DataExporter.downloadFile(blob, filename);
  },

  // Export analytics with progress
  async exportAnalyticsWithProgress(
    entityType: 'player' | 'club' | 'tournament',
    entityId: string,
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<void> {
    const exporter = new DataExporter(onProgress);
    const blob = await exporter.exportAnalytics(entityType, entityId, options);
    const filename = `analytics-${entityType}-${entityId}-${Date.now()}.${options.format}`;
    DataExporter.downloadFile(blob, filename);
  },
};
