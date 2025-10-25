import { z } from 'zod';

// SyncType enum
export const SyncTypeSchema = z.enum(['FULL', 'INCREMENTAL']);
export type SyncType = z.infer<typeof SyncTypeSchema>;

// SyncStatusEnum for SyncLog
export const SyncStatusEnumSchema = z.enum(['RUNNING', 'COMPLETED', 'FAILED']);
export type SyncStatusEnum = z.infer<typeof SyncStatusEnumSchema>;

// EntitySyncStatus for Player and Game
export const EntitySyncStatusSchema = z.enum(['SYNCED', 'PENDING', 'ERROR']);
export type EntitySyncStatus = z.infer<typeof EntitySyncStatusSchema>;

// Error object schema
export const ErrorSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
  timestamp: z.string().optional(),
  details: z.record(z.unknown()).optional(),
});

// SyncLog schema
export const SyncLogSchema = z
  .object({
    id: z.string().uuid(),
    type: SyncTypeSchema,
    status: SyncStatusEnumSchema,
    startTime: z.date(),
    endTime: z.date().nullable(),
    recordsProcessed: z.number().int().min(0).nullable(),
    errors: z.array(ErrorSchema).nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .refine((data) => !data.endTime || data.endTime >= data.startTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  });

export type SyncLog = z.infer<typeof SyncLogSchema>;

// Create SyncLog schema (without auto-generated fields)
export const CreateSyncLogSchema = SyncLogSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateSyncLog = z.infer<typeof CreateSyncLogSchema>;

// Update SyncLog schema (all fields optional except id)
export const UpdateSyncLogSchema = SyncLogSchema.omit({
  id: true,
}).partial();

export type UpdateSyncLog = z.infer<typeof UpdateSyncLogSchema>;

// SyncStatus schema
export const SyncStatusSchema = z
  .object({
    id: z.string(),
    lastSyncTime: z.date().nullable(),
    lastSyncType: SyncTypeSchema.nullable(),
    isRunning: z.boolean(),
    progress: z.number().int().min(0).max(100).nullable(),
    currentOperation: z.string().nullable(),
    lastError: z.string().nullable(),
    updatedAt: z.date(),
  })
  .refine((data) => !data.lastSyncTime || data.lastSyncTime <= new Date(), {
    message: 'Last sync time must be in the past',
    path: ['lastSyncTime'],
  })
  .refine(
    (data) => !data.progress || (data.progress >= 0 && data.progress <= 100),
    {
      message: 'Progress must be between 0 and 100',
      path: ['progress'],
    }
  );

export type SyncStatus = z.infer<typeof SyncStatusSchema>;

// Update SyncStatus schema
export const UpdateSyncStatusSchema = SyncStatusSchema.omit({
  id: true,
  updatedAt: true,
}).partial();

export type UpdateSyncStatus = z.infer<typeof UpdateSyncStatusSchema>;
