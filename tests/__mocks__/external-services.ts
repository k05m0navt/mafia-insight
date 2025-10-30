// Mock implementation of external services for testing
export const externalServices = {
  // Mock Supabase client
  supabase: {
    auth: {
      signUp: jest.fn().mockImplementation(async (credentials: any) => {
        return {
          data: {
            user: {
              id: 'mock-supabase-user-id',
              email: credentials.email,
            },
            session: {
              access_token: 'mock-supabase-token',
              refresh_token: 'mock-supabase-refresh-token',
            },
          },
          error: null,
        };
      }),

      signInWithPassword: jest
        .fn()
        .mockImplementation(async (credentials: any) => {
          if (
            credentials.email === 'test@example.com' &&
            credentials.password === 'password123'
          ) {
            return {
              data: {
                user: {
                  id: 'mock-supabase-user-id',
                  email: credentials.email,
                },
                session: {
                  access_token: 'mock-supabase-token',
                  refresh_token: 'mock-supabase-refresh-token',
                },
              },
              error: null,
            };
          }

          return {
            data: null,
            error: { message: 'Invalid credentials' },
          };
        }),

      signOut: jest.fn().mockImplementation(async () => {
        return {
          data: null,
          error: null,
        };
      }),

      getUser: jest.fn().mockImplementation(async () => {
        return {
          data: {
            user: {
              id: 'mock-supabase-user-id',
              email: 'test@example.com',
            },
          },
          error: null,
        };
      }),

      resetPasswordForEmail: jest
        .fn()
        .mockImplementation(async (_email: string) => {
          return {
            data: null,
            error: null,
          };
        }),
    },

    from: jest.fn().mockImplementation((_table: string) => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockImplementation(async () => ({
        data: { id: 'mock-id', name: 'Mock Data' },
        error: null,
      })),
      then: jest.fn().mockImplementation(async (callback: any) => {
        const result = {
          data: [{ id: 'mock-id', name: 'Mock Data' }],
          error: null,
        };
        return callback ? callback(result) : result;
      }),
    })),
  },

  // Mock Redis client
  redis: {
    get: jest.fn().mockImplementation(async (key: string) => {
      const mockData: Record<string, string> = {
        'session:mock-token': JSON.stringify({
          userId: 'mock-user-id',
          email: 'test@example.com',
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        }),
        'user:mock-user-id': JSON.stringify({
          id: 'mock-user-id',
          email: 'test@example.com',
          name: 'Test User',
        }),
      };
      return mockData[key] || null;
    }),

    set: jest
      .fn()
      .mockImplementation(
        async (_key: string, _value: string, _options?: unknown) => {
          return 'OK';
        }
      ),

    del: jest.fn().mockImplementation(async (_key: string) => {
      return 1;
    }),

    exists: jest.fn().mockImplementation(async (_key: string) => {
      return 1;
    }),

    expire: jest
      .fn()
      .mockImplementation(async (_key: string, _seconds: number) => {
        return 1;
      }),

    ping: jest.fn().mockImplementation(async () => {
      return 'PONG';
    }),
  },

  // Mock Gomafia API
  gomafiaApi: {
    getGames: jest.fn().mockImplementation(async (_params: unknown) => {
      return {
        data: [
          {
            id: 'gomafia-game-1',
            name: 'Gomafia Game 1',
            status: 'active',
            players: [],
          },
          {
            id: 'gomafia-game-2',
            name: 'Gomafia Game 2',
            status: 'completed',
            players: [],
          },
        ],
        error: null,
      };
    }),

    getGame: jest.fn().mockImplementation(async (gameId: string) => {
      return {
        data: {
          id: gameId,
          name: `Gomafia Game ${gameId}`,
          status: 'active',
          players: [],
        },
        error: null,
      };
    }),

    getPlayers: jest.fn().mockImplementation(async (gameId: string) => {
      return {
        data: [
          {
            id: 'gomafia-player-1',
            name: 'Gomafia Player 1',
            gameId: gameId,
          },
          {
            id: 'gomafia-player-2',
            name: 'Gomafia Player 2',
            gameId: gameId,
          },
        ],
        error: null,
      };
    }),

    syncData: jest.fn().mockImplementation(async (data: any) => {
      return {
        success: true,
        recordsProcessed: data.length || 0,
        errors: [],
      };
    }),
  },

  // Mock email service
  emailService: {
    sendEmail: jest
      .fn()
      .mockImplementation(
        async (_options: {
          to: string;
          subject: string;
          text?: string;
          html?: string;
        }) => {
          return {
            success: true,
            messageId: 'mock-message-id',
          };
        }
      ),

    sendPasswordResetEmail: jest
      .fn()
      .mockImplementation(async (_email: string, _token: string) => {
        return {
          success: true,
          messageId: 'mock-password-reset-message-id',
        };
      }),

    sendWelcomeEmail: jest
      .fn()
      .mockImplementation(async (_email: string, _name: string) => {
        return {
          success: true,
          messageId: 'mock-welcome-message-id',
        };
      }),
  },

  // Mock file storage service
  fileStorage: {
    upload: jest.fn().mockImplementation(async (file: any, path: string) => {
      return {
        success: true,
        url: `https://mock-storage.com/${path}`,
        key: path,
      };
    }),

    delete: jest.fn().mockImplementation(async (_key: string) => {
      return {
        success: true,
        message: 'File deleted successfully',
      };
    }),

    getUrl: jest.fn().mockImplementation(async (_key: string) => {
      return 'https://mock-storage.com/test';
    }),
  },

  // Mock analytics service
  analytics: {
    track: jest
      .fn()
      .mockImplementation(async (_event: string, _properties: unknown) => {
        return {
          success: true,
          eventId: 'mock-event-id',
        };
      }),

    identify: jest
      .fn()
      .mockImplementation(async (userId: string, _traits: unknown) => {
        return {
          success: true,
          userId,
        };
      }),

    page: jest
      .fn()
      .mockImplementation(async (_pageName: string, _properties: unknown) => {
        return {
          success: true,
          pageId: 'mock-page-id',
        };
      }),
  },

  // Mock monitoring service
  monitoring: {
    captureException: jest
      .fn()
      .mockImplementation(async (_error: Error, _context: unknown) => {
        return {
          success: true,
          eventId: 'mock-exception-id',
        };
      }),

    captureMessage: jest
      .fn()
      .mockImplementation(async (_message: string, _level: string) => {
        return {
          success: true,
          eventId: 'mock-message-id',
        };
      }),

    addBreadcrumb: jest.fn().mockImplementation((_breadcrumb: unknown) => {
      return true;
    }),
  },

  // Mock configuration
  config: {
    supabase: {
      url: 'https://mock.supabase.co',
      anonKey: 'mock-anon-key',
    },
    redis: {
      url: 'redis://localhost:6379',
    },
    gomafia: {
      baseUrl: 'https://mock-gomafia.pro',
      apiKey: 'mock-api-key',
    },
    email: {
      from: 'noreply@mafia-insight.com',
    },
  },

  // Reset all mocks
  resetMocks: () => {
    Object.values(externalServices).forEach((service) => {
      if (typeof service === 'object' && service !== null) {
        Object.values(service).forEach((fn) => {
          if (typeof fn === 'function' && 'mockReset' in fn) {
            fn.mockReset();
          }
        });
      }
    });
  },
};

export default externalServices;
