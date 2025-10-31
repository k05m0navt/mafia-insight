/**
 * Supabase Mock for Testing
 *
 * Provides mock implementations of Supabase client methods
 * to enable unit and integration testing without real Supabase connection.
 */

import { vi } from 'vitest';

// Mock user data
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    name: 'Test User',
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  aud: 'authenticated',
  role: 'authenticated',
};

export const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() / 1000 + 3600,
  token_type: 'bearer',
  user: mockUser,
};

// Mock auth methods
export const mockAuth = {
  getUser: vi.fn().mockResolvedValue({
    data: { user: mockUser },
    error: null,
  }),
  getSession: vi.fn().mockResolvedValue({
    data: { session: mockSession },
    error: null,
  }),
  signInWithPassword: vi.fn().mockResolvedValue({
    data: { user: mockUser, session: mockSession },
    error: null,
  }),
  signUp: vi.fn().mockResolvedValue({
    data: { user: mockUser, session: mockSession },
    error: null,
  }),
  signOut: vi.fn().mockResolvedValue({
    error: null,
  }),
  updateUser: vi.fn().mockResolvedValue({
    data: { user: mockUser },
    error: null,
  }),
  resetPasswordForEmail: vi.fn().mockResolvedValue({
    data: {},
    error: null,
  }),
  onAuthStateChange: vi.fn((callback) => {
    // Immediately call with current session
    callback('SIGNED_IN', mockSession);

    return {
      data: { subscription: { unsubscribe: vi.fn() } },
    };
  }),
};

// Mock storage methods
export const mockStorage = {
  from: vi.fn((bucket: string) => ({
    upload: vi.fn().mockResolvedValue({
      data: { path: `${bucket}/test-file.jpg` },
      error: null,
    }),
    download: vi.fn().mockResolvedValue({
      data: new Blob(['mock file content']),
      error: null,
    }),
    remove: vi.fn().mockResolvedValue({
      data: null,
      error: null,
    }),
    getPublicUrl: vi.fn((path: string) => ({
      data: { publicUrl: `https://mock-storage.supabase.co/${bucket}/${path}` },
    })),
    list: vi.fn().mockResolvedValue({
      data: [],
      error: null,
    }),
  })),
};

// Mock database query builder
const createMockQueryBuilder = () => {
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: mockUser,
      error: null,
    }),
    maybeSingle: vi.fn().mockResolvedValue({
      data: mockUser,
      error: null,
    }),
    then: vi.fn((resolve) => {
      resolve({
        data: [mockUser],
        error: null,
        count: 1,
        status: 200,
        statusText: 'OK',
      });
      return Promise.resolve();
    }),
  };

  return builder;
};

// Mock from method for database queries
export const mockFrom = vi.fn((table: string) => {
  const builder = createMockQueryBuilder();

  // Customize responses based on table
  if (table === 'users') {
    builder.single.mockResolvedValue({
      data: mockUser,
      error: null,
    });
  }

  return builder;
});

// Mock Supabase client
export const mockSupabaseClient = {
  auth: mockAuth,
  storage: mockStorage,
  from: mockFrom,
  rpc: vi.fn().mockResolvedValue({
    data: null,
    error: null,
  }),
};

// Mock client creation functions
export const createClient = vi.fn(() => mockSupabaseClient);

export const createBrowserClient = vi.fn(() => mockSupabaseClient);

export const createServerClient = vi.fn(() => mockSupabaseClient);

export const createRouteHandlerClient = vi.fn(() =>
  Promise.resolve(mockSupabaseClient)
);

export const createServerComponentClient = vi.fn(() =>
  Promise.resolve(mockSupabaseClient)
);

// Helper to reset all mocks
export const resetSupabaseMocks = () => {
  vi.clearAllMocks();

  // Reset to default implementations
  mockAuth.getUser.mockResolvedValue({
    data: { user: mockUser },
    error: null,
  });

  mockAuth.getSession.mockResolvedValue({
    data: { session: mockSession },
    error: null,
  });
};

// Helper to mock authentication failure
export const mockAuthFailure = () => {
  mockAuth.getUser.mockResolvedValue({
    data: { user: null },
    error: { message: 'Not authenticated', status: 401 },
  });

  mockAuth.getSession.mockResolvedValue({
    data: { session: null },
    error: { message: 'No session', status: 401 },
  });
};

// Helper to mock successful authentication
export const mockAuthSuccess = (user = mockUser) => {
  mockAuth.getUser.mockResolvedValue({
    data: { user },
    error: null,
  });

  mockAuth.getSession.mockResolvedValue({
    data: { session: { ...mockSession, user } },
    error: null,
  });
};

export default mockSupabaseClient;
