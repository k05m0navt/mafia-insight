// Mock implementation of authService for testing
export const authService = {
  // Mock authentication state
  isAuthenticated: jest.fn().mockReturnValue(false),

  // Mock login function
  login: jest
    .fn()
    .mockImplementation(
      async (credentials: { email: string; password: string }) => {
        // Mock successful login for test credentials
        if (
          credentials.email === 'test@example.com' &&
          credentials.password === 'password123'
        ) {
          return {
            success: true,
            user: {
              id: 'test-user-id',
              email: credentials.email,
              name: 'Test User',
              role: 'user',
              isActive: true,
            },
            token: 'mock-jwt-token',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          };
        }

        // Mock failed login
        return {
          success: false,
          error: 'Invalid credentials',
        };
      }
    ),

  // Mock logout function
  logout: jest.fn().mockImplementation(() => {
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }),

  // Mock register function
  register: jest
    .fn()
    .mockImplementation(
      async (userData: {
        email: string;
        password: string;
        name: string;
        role?: string;
      }) => {
        // Mock successful registration
        if (userData.email && userData.password && userData.name) {
          return {
            success: true,
            user: {
              id: 'new-user-id',
              email: userData.email,
              name: userData.name,
              role: userData.role || 'user',
              isActive: true,
            },
            message: 'User registered successfully',
          };
        }

        return {
          success: false,
          error: 'Registration failed',
        };
      }
    ),

  // Mock password reset function
  resetPassword: jest.fn().mockImplementation(async (_email: string) => {
    return {
      success: true,
      message: 'Password reset email sent',
    };
  }),

  // Mock confirm password reset function
  confirmPasswordReset: jest
    .fn()
    .mockImplementation(async (_token: string, _newPassword: string) => {
      return {
        success: true,
        message: 'Password reset successfully',
      };
    }),

  // Mock get current user function
  getCurrentUser: jest.fn().mockImplementation(() => {
    return {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
      isActive: true,
      lastLogin: new Date(),
    };
  }),

  // Mock update profile function
  updateProfile: jest.fn().mockImplementation(async (profileData: any) => {
    return {
      success: true,
      user: {
        id: 'test-user-id',
        ...profileData,
        updatedAt: new Date(),
      },
    };
  }),

  // Mock verify token function
  verifyToken: jest.fn().mockImplementation((token: string) => {
    if (token === 'mock-jwt-token') {
      return {
        valid: true,
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };
    }

    return {
      valid: false,
      error: 'Invalid token',
    };
  }),

  // Mock refresh token function
  refreshToken: jest.fn().mockImplementation(() => {
    return {
      success: true,
      token: 'new-mock-jwt-token',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }),

  // Mock check permissions function
  checkPermissions: jest.fn().mockImplementation((permission: string) => {
    const user = authService.getCurrentUser();
    if (user.role === 'admin') {
      return true;
    }

    const userPermissions = ['read:profile', 'update:profile'];
    return userPermissions.includes(permission);
  }),

  // Mock session management
  getSession: jest.fn().mockImplementation(() => {
    return {
      user: authService.getCurrentUser(),
      token: 'mock-jwt-token',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }),

  // Mock session validation
  validateSession: jest.fn().mockImplementation(() => {
    return {
      valid: true,
      user: authService.getCurrentUser(),
    };
  }),

  // Mock error handling
  handleAuthError: jest.fn().mockImplementation((error: Error) => {
    return {
      error: error.message,
      code: 'AUTH_ERROR',
      timestamp: new Date(),
    };
  }),

  // Mock configuration
  config: {
    tokenExpiry: 24 * 60 * 60 * 1000, // 24 hours
    refreshThreshold: 60 * 60 * 1000, // 1 hour
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
  },

  // Reset all mocks
  resetMocks: () => {
    Object.values(authService).forEach((fn) => {
      if (typeof fn === 'function' && 'mockReset' in fn) {
        fn.mockReset();
      }
    });
  },
};

export default authService;
