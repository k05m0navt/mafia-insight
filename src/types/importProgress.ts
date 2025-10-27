export type ImportStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface ImportProgress {
  id: string;
  operation: string;
  progress: number; // 0-100
  totalRecords: number;
  processedRecords: number;
  errors: number;
  startTime: Date;
  estimatedCompletion?: Date;
  status: ImportStatus;
}

export interface ImportProgressUpdate {
  progress: number;
  processedRecords: number;
  totalRecords: number;
  errors: number;
  operation: string;
  status: ImportStatus;
}
