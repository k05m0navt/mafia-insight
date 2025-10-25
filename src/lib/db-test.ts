// Test database configuration
import { mockDb } from './test-db';

// Use mock database for E2E tests
export const prisma =
  mockDb as unknown as typeof import('@prisma/client').PrismaClient;
