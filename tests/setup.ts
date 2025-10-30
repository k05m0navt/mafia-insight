import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Prisma client for testing
vi.mock('@prisma/client', () => {
  const mockPrisma = {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    game: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    player: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    syncStatus: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    syncLog: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $executeRaw: vi.fn(),
    $queryRaw: vi.fn(),
  };

  return {
    PrismaClient: vi.fn(() => mockPrisma),
  };
});

// Mock @/lib/db module
vi.mock('@/lib/db', () => {
  const mockPrisma = {
    user: {
      create: vi
        .fn()
        .mockImplementation(
          async (data: {
            data: {
              email?: string;
              name?: string;
              role?: string;
              isActive?: boolean;
            };
          }) => {
            return {
              id: 'mock-user-id',
              email: data.data.email,
              name: data.data.name,
              role: data.data.role || 'user',
              isActive: data.data.isActive !== false,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          }
        ),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    game: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    player: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    syncStatus: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      upsert: vi
        .fn()
        .mockImplementation(
          async (query: {
            where: { id: string };
            data: {
              isRunning?: boolean;
              progress?: number;
              currentOperation?: string | null;
              lastError?: string | null;
              lastSyncTime?: Date | null;
              progressPercentage?: number;
            };
          }) => {
            return {
              id: query.where.id,
              isRunning: query.data.isRunning || false,
              progress: query.data.progress || 0,
              currentOperation: query.data.currentOperation || null,
              lastError: query.data.lastError || null,
              lastSyncTime: query.data.lastSyncTime || null,
              lastSyncType: query.data.lastSyncType || null,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          }
        ),
    },
    syncLog: {
      create: vi
        .fn()
        .mockImplementation(
          async (data: {
            data: {
              type?: string;
              status?: string;
              startTime?: Date;
              endTime?: Date | null;
              recordsProcessed?: number;
              errors?: unknown;
            };
          }) => {
            return {
              id: 'mock-sync-log-id',
              type: data.data.type || 'FULL',
              status: data.data.status || 'RUNNING',
              startTime: data.data.startTime || new Date(),
              endTime: data.data.endTime || null,
              recordsProcessed: data.data.recordsProcessed || 0,
              errors: data.data.errors || null,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          }
        ),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi
        .fn()
        .mockImplementation(
          async (query: {
            where: { id: string };
            data: {
              type?: string;
              status?: string;
              startTime?: Date;
              endTime?: Date;
              recordsProcessed?: number;
              errors?: unknown;
            };
          }) => {
            return {
              id: query.where.id,
              type: query.data.type || 'FULL',
              status: query.data.status || 'COMPLETED',
              startTime: query.data.startTime || new Date(),
              endTime: query.data.endTime || new Date(),
              recordsProcessed: query.data.recordsProcessed || 0,
              errors: query.data.errors || null,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          }
        ),
      delete: vi.fn(),
    },
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $executeRaw: vi.fn(),
    $queryRaw: vi.fn(),
  };

  return {
    prisma: mockPrisma,
    db: mockPrisma,
  };
});

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: () => ({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    push: vi.fn(),
    pop: vi.fn(),
    reload: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
    beforePopState: vi.fn(),
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
  }),
}));

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => '/',
}));

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

// Database
process.env.DATABASE_URL = 'file:./test.db';
process.env.DIRECT_URL = 'file:./test.db';
process.env.TEST_DATABASE_URL = 'file:./test.db';

// Supabase
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

// NextAuth.js
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// OAuth Providers
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
process.env.DISCORD_CLIENT_ID = 'test-discord-client-id';
process.env.DISCORD_CLIENT_SECRET = 'test-discord-client-secret';
process.env.GITHUB_CLIENT_ID = 'test-github-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-github-client-secret';

// Redis
process.env.REDIS_URL = 'redis://localhost:6379';

// Analytics & Monitoring
process.env.SENTRY_DSN = '';
process.env.GOOGLE_ANALYTICS_ID = '';

// Rate Limiting
process.env.RATE_LIMIT_MAX = '1000';
process.env.RATE_LIMIT_WINDOW = '900000';

// Data Sync
process.env.GOMAFIA_API_URL = 'https://test-gomafia.pro/api';
process.env.SYNC_INTERVAL = '300000';
process.env.GOMAFIA_BASE_URL = 'https://test-gomafia.pro';
process.env.SYNC_BATCH_SIZE = '10';
process.env.SYNC_MAX_RETRIES = '3';

// Security
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.ENCRYPTION_KEY = 'test-encryption-key';

// Test Configuration
process.env.TEST_TIMEOUT = '30000';

// Mock authentication service
vi.mock('@/services/AuthService', () => ({
  authService: {
    isAuthenticated: vi.fn(() => false),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    resetPassword: vi.fn(),
    updateProfile: vi.fn(),
    getCurrentUser: vi.fn(() => null),
    verifyToken: vi.fn(),
    refreshToken: vi.fn(),
    checkPermissions: vi.fn(() => false),
    getSession: vi.fn(() => ({ user: null, token: null, expiresAt: null })),
    validateSession: vi.fn(() => ({ valid: false })),
    handleAuthError: vi.fn(),
  },
  AuthService: vi.fn(() => ({
    isAuthenticated: vi.fn(() => false),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    resetPassword: vi.fn(),
    updateProfile: vi.fn(),
    getCurrentUser: vi.fn(() => null),
    verifyToken: vi.fn(),
    refreshToken: vi.fn(),
    checkPermissions: vi.fn(() => false),
    getSession: vi.fn(() => ({ user: null, token: null, expiresAt: null })),
    validateSession: vi.fn(() => ({ valid: false })),
    handleAuthError: vi.fn(),
  })),
}));

// Mock gomafiaParser
vi.mock('@/lib/parsers/gomafiaParser', () => ({
  parsePlayerList: vi
    .fn()
    .mockImplementation(async (data: unknown) => data || []),
  parsePlayer: vi
    .fn()
    .mockImplementation(
      (playerData: {
        id?: string;
        name?: string;
        gameId?: string;
        userId?: string | null;
      }) => {
        return {
          id: playerData.id || 'mock-player-id',
          name: playerData.name || 'Mock Player',
          gameId: playerData.gameId || 'mock-game-id',
          userId: playerData.userId || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
    ),
  cleanup: vi.fn().mockImplementation(async () => {
    return Promise.resolve();
  }),
}));

// Mock validation functions
vi.mock('@/lib/validation', () => ({
  validateEmail: vi.fn(() => ({ isValid: true, error: null })),
  validatePassword: vi.fn(() => ({ isValid: true, errors: [] })),
  validateName: vi.fn(() => ({ isValid: true, errors: [] })),
  validateLoginCredentials: vi.fn(() => ({ isValid: true, errors: {} })),
  validateRegistrationData: vi.fn(() => ({ isValid: true, errors: {} })),
  validateSignupCredentials: vi.fn(() => ({ isValid: true, errors: {} })),
  validateForm: vi.fn(() => ({ isValid: true, errors: {} })),
  validateGameData: vi.fn(() => ({ isValid: true, errors: [] })),
  validatePlayerData: vi.fn(() => ({ isValid: true, errors: [] })),
  sanitizeString: vi.fn((str) => str),
  sanitizeEmail: vi.fn((email) => email),
  sanitizeName: vi.fn((name) => name),
  validationRules: {},
}));

// Mock auth module validation functions (used by LoginForm and SignupForm)
vi.mock('@/lib/auth', async () => {
  const actual = await vi.importActual('@/lib/auth');
  return {
    ...actual,
    validateEmail: vi.fn((email: string) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ),
    validatePassword: vi.fn((password: string) => ({
      isValid: password.length >= 6,
      errors:
        password.length < 6 ? ['Password must be at least 6 characters'] : [],
    })),
    validateLoginCredentials: vi.fn(
      (credentials: { email?: string; password?: string }) => ({
        isValid: !!(credentials?.email && credentials?.password),
        errors:
          credentials?.email && credentials?.password
            ? {}
            : { email: 'Email is required', password: 'Password is required' },
      })
    ),
    validateSignupCredentials: vi.fn(
      (userData: { email?: string; password?: string; name?: string }) => ({
        isValid: !!(userData?.email && userData?.password && userData?.name),
        errors:
          userData?.email && userData?.password && userData?.name
            ? {}
            : {
                email: 'Email is required',
                password: 'Password is required',
                name: 'Name is required',
              },
      })
    ),
  };
});

// Mock AuthProvider
vi.mock('@/components/auth/AuthProvider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuthContext: vi.fn(() => ({
    state: {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    },
    dispatch: vi.fn(),
  })),
}));

// Mock hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    resetPassword: vi.fn(),
    updateProfile: vi.fn(),
    clearError: vi.fn(),
  })),
}));

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: vi.fn(() => ({
    canAccessPage: vi.fn(() => true),
    canPerformAction: vi.fn(() => true),
    hasRole: vi.fn(() => false),
  })),
}));

vi.mock('@/hooks/useSession', () => ({
  useSession: vi.fn(() => ({
    user: null,
    token: null,
    expiresAt: null,
    isValid: false,
    refreshSession: vi.fn(),
    isExpired: vi.fn(() => false),
    needsRefresh: vi.fn(() => false),
  })),
}));

// Mock window.matchMedia for accessibility tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
