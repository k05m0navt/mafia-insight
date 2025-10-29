import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { testLogger } from '../../utils/logging/TestLogger';

// Mock the database connection
const mockDb = {
  query: vi.fn(),
  transaction: vi.fn(),
};

// Mock the password hashing service
const mockPasswordService = {
  hash: vi.fn(),
  compare: vi.fn(),
  validateStrength: vi.fn(),
};

// Mock the JWT service
const mockJwtService = {
  generate: vi.fn(),
  verify: vi.fn(),
  refresh: vi.fn(),
};

// Mock the email service
const mockEmailService = {
  sendPasswordResetEmail: vi.fn(),
  sendVerificationEmail: vi.fn(),
};

// Mock the crypto service for token generation
const mockCryptoService = {
  randomBytes: vi.fn(),
  createHash: vi.fn(),
};

// Import the actual auth service (this would be the real implementation)
// For now, we'll create a mock implementation that uses the mocked dependencies
const createAuthService = () => ({
  async login(credentials: { email: string; password: string }) {
    try {
      // Validate input
      if (!credentials.email || !credentials.password) {
        return { success: false, error: 'Email and password are required' };
      }

      // Check if user exists
      const userResult = await mockDb.query(
        'SELECT * FROM users WHERE email = $1 AND is_active = true',
        [credentials.email]
      );

      if (userResult.rows.length === 0) {
        return { success: false, error: 'Invalid email or password' };
      }

      const user = userResult.rows[0];

      // Check if user is verified
      if (!user.is_verified) {
        return {
          success: false,
          error: 'Please verify your email before logging in',
        };
      }

      // Verify password
      const isPasswordValid = await mockPasswordService.compare(
        credentials.password,
        user.password
      );
      if (!isPasswordValid) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Generate JWT token
      const token = mockJwtService.generate({
        userId: user.id,
        email: user.email,
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        token,
      };
    } catch (error) {
      testLogger.error('Login error', error as Error, 'AuthService');
      return { success: false, error: 'Internal server error' };
    }
  },

  async register(userData: { name: string; email: string; password: string }) {
    try {
      // Validate input
      if (!userData.name || !userData.email || !userData.password) {
        return {
          success: false,
          error: 'Name, email, and password are required',
        };
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        return { success: false, error: 'Invalid email format' };
      }

      // Validate password strength
      const passwordValidation = mockPasswordService.validateStrength(
        userData.password
      );
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: 'Password does not meet strength requirements',
          details: passwordValidation.errors,
        };
      }

      // Check if user already exists
      const existingUserResult = await mockDb.query(
        'SELECT id FROM users WHERE email = $1',
        [userData.email]
      );

      if (existingUserResult.rows.length > 0) {
        return { success: false, error: 'Email already exists' };
      }

      // Hash password
      const hashedPassword = await mockPasswordService.hash(userData.password);

      // Create user
      const userResult = await mockDb.query(
        'INSERT INTO users (name, email, password, is_verified, is_active, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id',
        [userData.name, userData.email, hashedPassword, false, true]
      );

      const userId = userResult.rows[0].id;

      // Generate verification token
      const verificationToken = mockCryptoService
        .randomBytes(32)
        .toString('hex');

      // Store verification token
      await mockDb.query(
        'INSERT INTO email_verification_tokens (user_id, token, expires_at, created_at) VALUES ($1, $2, $3, NOW())',
        [userId, verificationToken, new Date(Date.now() + 24 * 60 * 60 * 1000)] // 24 hours
      );

      // Send verification email
      await mockEmailService.sendVerificationEmail(
        userData.email,
        verificationToken
      );

      // Generate JWT token
      const token = mockJwtService.generate({ userId, email: userData.email });

      return {
        success: true,
        user: {
          id: userId,
          name: userData.name,
          email: userData.email,
        },
        token,
      };
    } catch (error) {
      testLogger.error('Registration error', error as Error, 'AuthService');
      return { success: false, error: 'Internal server error' };
    }
  },

  async logout(userId: number, token: string) {
    try {
      // Add token to blacklist
      await mockDb.query(
        'INSERT INTO token_blacklist (token, user_id, created_at) VALUES ($1, $2, NOW())',
        [token, userId]
      );

      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      testLogger.error('Logout error', error as Error, 'AuthService');
      return { success: false, error: 'Internal server error' };
    }
  },

  async forgotPassword(email: string) {
    try {
      if (!email) {
        return { success: false, error: 'Email is required' };
      }

      // Check if user exists
      const userResult = await mockDb.query(
        'SELECT * FROM users WHERE email = $1 AND is_active = true',
        [email]
      );

      if (userResult.rows.length === 0) {
        return { success: false, error: 'Email not found' };
      }

      const user = userResult.rows[0];

      // Generate reset token
      const resetToken = mockCryptoService.randomBytes(32).toString('hex');

      // Store reset token
      await mockDb.query(
        'INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at) VALUES ($1, $2, $3, NOW())',
        [user.id, resetToken, new Date(Date.now() + 60 * 60 * 1000)] // 1 hour
      );

      // Send reset email
      await mockEmailService.sendPasswordResetEmail(email, resetToken);

      return { success: true, message: 'Password reset email sent' };
    } catch (error) {
      testLogger.error('Forgot password error', error as Error, 'AuthService');
      return { success: false, error: 'Internal server error' };
    }
  },

  async resetPassword(resetData: { token: string; newPassword: string }) {
    try {
      if (!resetData.token || !resetData.newPassword) {
        return { success: false, error: 'Token and new password are required' };
      }

      // Validate password strength
      const passwordValidation = mockPasswordService.validateStrength(
        resetData.newPassword
      );
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: 'Password does not meet strength requirements',
          details: passwordValidation.errors,
        };
      }

      // Check if token is valid and not expired
      const tokenResult = await mockDb.query(
        'SELECT * FROM password_reset_tokens WHERE token = $1 AND used = false AND expires_at > NOW()',
        [resetData.token]
      );

      if (tokenResult.rows.length === 0) {
        return { success: false, error: 'Invalid or expired reset token' };
      }

      const tokenData = tokenResult.rows[0];

      // Hash new password
      const hashedPassword = await mockPasswordService.hash(
        resetData.newPassword
      );

      // Update user password
      await mockDb.query(
        'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
        [hashedPassword, tokenData.user_id]
      );

      // Mark token as used
      await mockDb.query(
        'UPDATE password_reset_tokens SET used = true, used_at = NOW() WHERE id = $1',
        [tokenData.id]
      );

      return { success: true, message: 'Password reset successfully' };
    } catch (error) {
      testLogger.error('Reset password error', error as Error, 'AuthService');
      return { success: false, error: 'Internal server error' };
    }
  },

  async validateToken(token: string) {
    try {
      if (!token) {
        return { success: false, error: 'Token is required' };
      }

      // Verify JWT token
      const decoded = mockJwtService.verify(token);

      // Check if token is blacklisted
      const blacklistResult = await mockDb.query(
        'SELECT id FROM token_blacklist WHERE token = $1',
        [token]
      );

      if (blacklistResult.rows.length > 0) {
        return { success: false, error: 'Token has been revoked' };
      }

      // Check if user is still active
      const userResult = await mockDb.query(
        'SELECT id, is_active FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
        return { success: false, error: 'User not found or inactive' };
      }

      return {
        success: true,
        user: { id: decoded.userId, email: decoded.email },
      };
    } catch (error) {
      testLogger.error('Token validation error', error as Error, 'AuthService');
      return { success: false, error: 'Invalid token' };
    }
  },

  async refreshToken(refreshToken: string) {
    try {
      if (!refreshToken) {
        return { success: false, error: 'Refresh token is required' };
      }

      // Verify refresh token
      const decoded = mockJwtService.verify(refreshToken);

      // Check if user is still active
      const userResult = await mockDb.query(
        'SELECT id, is_active FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
        return { success: false, error: 'User not found or inactive' };
      }

      // Generate new access token
      const newAccessToken = mockJwtService.refresh({
        userId: decoded.userId,
        email: decoded.email,
      });

      return { success: true, token: newAccessToken };
    } catch (error) {
      testLogger.error('Token refresh error', error as Error, 'AuthService');
      return { success: false, error: 'Invalid refresh token' };
    }
  },

  async verifyEmail(token: string) {
    try {
      if (!token) {
        return { success: false, error: 'Verification token is required' };
      }

      // Check if token is valid and not expired
      const tokenResult = await mockDb.query(
        'SELECT * FROM email_verification_tokens WHERE token = $1 AND used = false AND expires_at > NOW()',
        [token]
      );

      if (tokenResult.rows.length === 0) {
        return {
          success: false,
          error: 'Invalid or expired verification token',
        };
      }

      const tokenData = tokenResult.rows[0];

      // Update user as verified
      await mockDb.query(
        'UPDATE users SET is_verified = true, updated_at = NOW() WHERE id = $1',
        [tokenData.user_id]
      );

      // Mark token as used
      await mockDb.query(
        'UPDATE email_verification_tokens SET used = true, used_at = NOW() WHERE id = $1',
        [tokenData.id]
      );

      return { success: true, message: 'Email verified successfully' };
    } catch (error) {
      testLogger.error(
        'Email verification error',
        error as Error,
        'AuthService'
      );
      return { success: false, error: 'Internal server error' };
    }
  },

  async resendVerification(email: string) {
    try {
      if (!email) {
        return { success: false, error: 'Email is required' };
      }

      // Check if user exists
      const userResult = await mockDb.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rows.length === 0) {
        return { success: false, error: 'Email not found' };
      }

      const user = userResult.rows[0];

      if (user.is_verified) {
        return { success: false, error: 'Email is already verified' };
      }

      // Generate new verification token
      const verificationToken = mockCryptoService
        .randomBytes(32)
        .toString('hex');

      // Store verification token
      await mockDb.query(
        'INSERT INTO email_verification_tokens (user_id, token, expires_at, created_at) VALUES ($1, $2, $3, NOW())',
        [user.id, verificationToken, new Date(Date.now() + 24 * 60 * 60 * 1000)] // 24 hours
      );

      // Send verification email
      await mockEmailService.sendVerificationEmail(email, verificationToken);

      return { success: true, message: 'Verification email sent' };
    } catch (error) {
      testLogger.error(
        'Resend verification error',
        error as Error,
        'AuthService'
      );
      return { success: false, error: 'Internal server error' };
    }
  },
});

describe('Authentication Service Unit Tests', () => {
  let authService: ReturnType<typeof createAuthService>;

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Setup default mock implementations
    mockPasswordService.hash.mockResolvedValue('hashed-password');
    mockPasswordService.compare.mockResolvedValue(true);
    mockPasswordService.validateStrength.mockReturnValue({
      isValid: true,
      score: 4,
      errors: [],
    });

    mockJwtService.generate.mockReturnValue('jwt-token');
    mockJwtService.verify.mockReturnValue({
      userId: 1,
      email: 'test@example.com',
    });
    mockJwtService.refresh.mockReturnValue('new-jwt-token');

    mockEmailService.sendPasswordResetEmail.mockResolvedValue(true);
    mockEmailService.sendVerificationEmail.mockResolvedValue(true);

    mockCryptoService.randomBytes.mockReturnValue(
      Buffer.from('random-token-data')
    );
    mockCryptoService.createHash.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      digest: vi.fn().mockReturnValue('hashed-token'),
    });

    // Create auth service instance
    authService = createAuthService();

    testLogger.info('Starting authentication service unit test', {
      test: 'Authentication Service Unit Tests',
    });
  });

  afterEach(() => {
    testLogger.info('Completed authentication service unit test', {
      test: 'Authentication Service Unit Tests',
    });
  });

  describe('User Login', () => {
    it('should login successfully with valid credentials', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed-password',
        is_verified: true,
        is_active: true,
      };

      mockDb.query.mockResolvedValue({ rows: [mockUser] });
      mockPasswordService.compare.mockResolvedValue(true);
      mockJwtService.generate.mockReturnValue('jwt-token');

      // Act
      const result = await authService.login(credentials);

      // Assert
      expect(result).toEqual({
        success: true,
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
        },
        token: 'jwt-token',
      });

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1 AND is_active = true',
        ['test@example.com']
      );
      expect(mockPasswordService.compare).toHaveBeenCalledWith(
        'password123',
        'hashed-password'
      );
      expect(mockJwtService.generate).toHaveBeenCalledWith({
        userId: 1,
        email: 'test@example.com',
      });

      testLogger.info('Login with valid credentials test passed', {
        test: 'should login successfully with valid credentials',
      });
    });

    it('should fail login with missing email', async () => {
      // Arrange
      const credentials = {
        email: '',
        password: 'password123',
      };

      // Act
      const result = await authService.login(credentials);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Email and password are required',
      });

      expect(mockDb.query).not.toHaveBeenCalled();

      testLogger.info('Login with missing email test passed', {
        test: 'should fail login with missing email',
      });
    });

    it('should fail login with missing password', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: '',
      };

      // Act
      const result = await authService.login(credentials);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Email and password are required',
      });

      expect(mockDb.query).not.toHaveBeenCalled();

      testLogger.info('Login with missing password test passed', {
        test: 'should fail login with missing password',
      });
    });

    it('should fail login with invalid email', async () => {
      // Arrange
      const credentials = {
        email: 'invalid@example.com',
        password: 'password123',
      };

      mockDb.query.mockResolvedValue({ rows: [] });

      // Act
      const result = await authService.login(credentials);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Invalid email or password',
      });

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1 AND is_active = true',
        ['invalid@example.com']
      );
      expect(mockPasswordService.compare).not.toHaveBeenCalled();

      testLogger.info('Login with invalid email test passed', {
        test: 'should fail login with invalid email',
      });
    });

    it('should fail login with invalid password', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed-password',
        is_verified: true,
        is_active: true,
      };

      mockDb.query.mockResolvedValue({ rows: [mockUser] });
      mockPasswordService.compare.mockResolvedValue(false);

      // Act
      const result = await authService.login(credentials);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Invalid email or password',
      });

      expect(mockPasswordService.compare).toHaveBeenCalledWith(
        'wrongpassword',
        'hashed-password'
      );

      testLogger.info('Login with invalid password test passed', {
        test: 'should fail login with invalid password',
      });
    });

    it('should fail login with unverified account', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed-password',
        is_verified: false,
        is_active: true,
      };

      mockDb.query.mockResolvedValue({ rows: [mockUser] });
      mockPasswordService.compare.mockResolvedValue(true);

      // Act
      const result = await authService.login(credentials);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Please verify your email before logging in',
      });

      testLogger.info('Login with unverified account test passed', {
        test: 'should fail login with unverified account',
      });
    });

    it('should handle database errors during login', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockDb.query.mockRejectedValue(new Error('Database connection failed'));

      // Act
      const result = await authService.login(credentials);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Internal server error',
      });

      testLogger.info('Database error during login test passed', {
        test: 'should handle database errors during login',
      });
    });
  });

  describe('User Registration', () => {
    it('should register successfully with valid data', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password123',
      };

      mockDb.query.mockResolvedValue({ rows: [] }); // No existing user
      mockPasswordService.validateStrength.mockReturnValue({
        isValid: true,
        score: 4,
        errors: [],
      });
      mockPasswordService.hash.mockResolvedValue('hashed-password');
      mockDb.query.mockResolvedValueOnce({ rows: [] }); // Check existing user
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Insert user
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Insert verification token
      mockJwtService.generate.mockReturnValue('jwt-token');
      mockEmailService.sendVerificationEmail.mockResolvedValue(true);

      // Act
      const result = await authService.register(userData);

      // Assert
      expect(result).toEqual({
        success: true,
        user: {
          id: 1,
          name: 'John Doe',
          email: 'john.doe@example.com',
        },
        token: 'jwt-token',
      });

      expect(mockPasswordService.validateStrength).toHaveBeenCalledWith(
        'password123'
      );
      expect(mockPasswordService.hash).toHaveBeenCalledWith('password123');
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledWith(
        'john.doe@example.com',
        expect.any(String)
      );

      testLogger.info('Registration with valid data test passed', {
        test: 'should register successfully with valid data',
      });
    });

    it('should fail registration with missing name', async () => {
      // Arrange
      const userData = {
        name: '',
        email: 'john.doe@example.com',
        password: 'password123',
      };

      // Act
      const result = await authService.register(userData);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Name, email, and password are required',
      });

      expect(mockPasswordService.validateStrength).not.toHaveBeenCalled();

      testLogger.info('Registration with missing name test passed', {
        test: 'should fail registration with missing name',
      });
    });

    it('should fail registration with invalid email format', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123',
      };

      // Act
      const result = await authService.register(userData);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Invalid email format',
      });

      expect(mockPasswordService.validateStrength).not.toHaveBeenCalled();

      testLogger.info('Registration with invalid email format test passed', {
        test: 'should fail registration with invalid email format',
      });
    });

    it('should fail registration with weak password', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: '123',
      };

      mockPasswordService.validateStrength.mockReturnValue({
        isValid: false,
        score: 1,
        errors: ['Password must be at least 8 characters long'],
      });

      // Act
      const result = await authService.register(userData);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Password does not meet strength requirements',
        details: ['Password must be at least 8 characters long'],
      });

      expect(mockPasswordService.validateStrength).toHaveBeenCalledWith('123');
      expect(mockPasswordService.hash).not.toHaveBeenCalled();

      testLogger.info('Registration with weak password test passed', {
        test: 'should fail registration with weak password',
      });
    });

    it('should fail registration with existing email', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'existing@example.com',
        password: 'password123',
      };

      const existingUser = {
        id: 1,
        email: 'existing@example.com',
        name: 'Existing User',
      };

      mockDb.query.mockResolvedValue({ rows: [existingUser] });

      // Act
      const result = await authService.register(userData);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Email already exists',
      });

      expect(mockPasswordService.validateStrength).not.toHaveBeenCalled();
      expect(mockPasswordService.hash).not.toHaveBeenCalled();

      testLogger.info('Registration with existing email test passed', {
        test: 'should fail registration with existing email',
      });
    });

    it('should handle database errors during registration', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password123',
      };

      mockDb.query.mockResolvedValue({ rows: [] }); // No existing user
      mockPasswordService.validateStrength.mockReturnValue({
        isValid: true,
        score: 4,
        errors: [],
      });
      mockPasswordService.hash.mockResolvedValue('hashed-password');
      mockDb.query.mockRejectedValue(new Error('Database connection failed'));

      // Act
      const result = await authService.register(userData);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Internal server error',
      });

      testLogger.info('Database error during registration test passed', {
        test: 'should handle database errors during registration',
      });
    });
  });

  describe('Password Reset', () => {
    it('should send password reset email successfully', async () => {
      // Arrange
      const email = 'test@example.com';
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
      };

      mockDb.query.mockResolvedValue({ rows: [mockUser] });
      mockDb.query.mockResolvedValue({ rows: [{ id: 1 }] }); // Insert reset token
      mockEmailService.sendPasswordResetEmail.mockResolvedValue(true);

      // Act
      const result = await authService.forgotPassword(email);

      // Assert
      expect(result).toEqual({
        success: true,
        message: 'Password reset email sent',
      });

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1 AND is_active = true',
        ['test@example.com']
      );
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String)
      );

      testLogger.info('Password reset email test passed', {
        test: 'should send password reset email successfully',
      });
    });

    it('should fail password reset with missing email', async () => {
      // Arrange
      const email = '';

      // Act
      const result = await authService.forgotPassword(email);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Email is required',
      });

      expect(mockDb.query).not.toHaveBeenCalled();

      testLogger.info('Password reset with missing email test passed', {
        test: 'should fail password reset with missing email',
      });
    });

    it('should fail password reset with non-existent email', async () => {
      // Arrange
      const email = 'nonexistent@example.com';

      mockDb.query.mockResolvedValue({ rows: [] });

      // Act
      const result = await authService.forgotPassword(email);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Email not found',
      });

      expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();

      testLogger.info('Password reset with non-existent email test passed', {
        test: 'should fail password reset with non-existent email',
      });
    });

    it('should reset password successfully with valid token', async () => {
      // Arrange
      const resetData = {
        token: 'valid-reset-token',
        newPassword: 'newpassword123',
      };

      const mockToken = {
        id: 1,
        user_id: 1,
        token: 'valid-reset-token',
        expires_at: new Date(Date.now() + 3600000), // 1 hour from now
        used: false,
      };

      mockDb.query.mockResolvedValue({ rows: [mockToken] });
      mockPasswordService.validateStrength.mockReturnValue({
        isValid: true,
        score: 4,
        errors: [],
      });
      mockPasswordService.hash.mockResolvedValue('hashed-new-password');
      mockDb.query.mockResolvedValue({ rows: [{ id: 1 }] }); // Update password
      mockDb.query.mockResolvedValue({ rows: [{ id: 1 }] }); // Mark token as used

      // Act
      const result = await authService.resetPassword(resetData);

      // Assert
      expect(result).toEqual({
        success: true,
        message: 'Password reset successfully',
      });

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM password_reset_tokens WHERE token = $1 AND used = false AND expires_at > NOW()',
        ['valid-reset-token']
      );
      expect(mockPasswordService.validateStrength).toHaveBeenCalledWith(
        'newpassword123'
      );
      expect(mockPasswordService.hash).toHaveBeenCalledWith('newpassword123');

      testLogger.info('Password reset with valid token test passed', {
        test: 'should reset password successfully with valid token',
      });
    });

    it('should fail password reset with missing token', async () => {
      // Arrange
      const resetData = {
        token: '',
        newPassword: 'newpassword123',
      };

      // Act
      const result = await authService.resetPassword(resetData);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Token and new password are required',
      });

      expect(mockPasswordService.validateStrength).not.toHaveBeenCalled();

      testLogger.info('Password reset with missing token test passed', {
        test: 'should fail password reset with missing token',
      });
    });

    it('should fail password reset with invalid token', async () => {
      // Arrange
      const resetData = {
        token: 'invalid-token',
        newPassword: 'newpassword123',
      };

      mockDb.query.mockResolvedValue({ rows: [] });

      // Act
      const result = await authService.resetPassword(resetData);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Invalid or expired reset token',
      });

      expect(mockPasswordService.validateStrength).not.toHaveBeenCalled();
      expect(mockPasswordService.hash).not.toHaveBeenCalled();

      testLogger.info('Password reset with invalid token test passed', {
        test: 'should fail password reset with invalid token',
      });
    });
  });

  describe('Token Management', () => {
    it('should validate token successfully', async () => {
      // Arrange
      const token = 'valid-jwt-token';
      const decodedToken = { userId: 1, email: 'test@example.com' };

      mockJwtService.verify.mockReturnValue(decodedToken);
      mockDb.query.mockResolvedValue({ rows: [] }); // Not blacklisted
      mockDb.query.mockResolvedValue({ rows: [{ id: 1, is_active: true }] }); // User active

      // Act
      const result = await authService.validateToken(token);

      // Assert
      expect(result).toEqual({
        success: true,
        user: { id: 1, email: 'test@example.com' },
      });

      expect(mockJwtService.verify).toHaveBeenCalledWith(token);
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT id FROM token_blacklist WHERE token = $1',
        [token]
      );
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT id, is_active FROM users WHERE id = $1',
        [1]
      );

      testLogger.info('Token validation test passed', {
        test: 'should validate token successfully',
      });
    });

    it('should fail token validation with missing token', async () => {
      // Arrange
      const token = '';

      // Act
      const result = await authService.validateToken(token);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Token is required',
      });

      expect(mockJwtService.verify).not.toHaveBeenCalled();

      testLogger.info('Token validation with missing token test passed', {
        test: 'should fail token validation with missing token',
      });
    });

    it('should fail token validation with invalid token', async () => {
      // Arrange
      const token = 'invalid-jwt-token';

      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      const result = await authService.validateToken(token);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Invalid token',
      });

      expect(mockJwtService.verify).toHaveBeenCalledWith(token);
      expect(mockDb.query).not.toHaveBeenCalled();

      testLogger.info('Token validation with invalid token test passed', {
        test: 'should fail token validation with invalid token',
      });
    });

    it('should fail token validation with blacklisted token', async () => {
      // Arrange
      const token = 'blacklisted-jwt-token';
      const decodedToken = { userId: 1, email: 'test@example.com' };

      mockJwtService.verify.mockReturnValue(decodedToken);
      mockDb.query.mockResolvedValue({ rows: [{ id: 1 }] }); // Token is blacklisted

      // Act
      const result = await authService.validateToken(token);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Token has been revoked',
      });

      expect(mockJwtService.verify).toHaveBeenCalledWith(token);
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT id FROM token_blacklist WHERE token = $1',
        [token]
      );

      testLogger.info('Token validation with blacklisted token test passed', {
        test: 'should fail token validation with blacklisted token',
      });
    });

    it('should refresh token successfully', async () => {
      // Arrange
      const refreshToken = 'valid-refresh-token';
      const newAccessToken = 'new-access-token';

      mockJwtService.verify.mockReturnValue({
        userId: 1,
        email: 'test@example.com',
      });
      mockJwtService.refresh.mockReturnValue(newAccessToken);
      mockDb.query.mockResolvedValue({ rows: [{ id: 1, is_active: true }] });

      // Act
      const result = await authService.refreshToken(refreshToken);

      // Assert
      expect(result).toEqual({
        success: true,
        token: newAccessToken,
      });

      expect(mockJwtService.verify).toHaveBeenCalledWith(refreshToken);
      expect(mockJwtService.refresh).toHaveBeenCalledWith({
        userId: 1,
        email: 'test@example.com',
      });

      testLogger.info('Token refresh test passed', {
        test: 'should refresh token successfully',
      });
    });

    it('should fail token refresh with missing token', async () => {
      // Arrange
      const refreshToken = '';

      // Act
      const result = await authService.refreshToken(refreshToken);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Refresh token is required',
      });

      expect(mockJwtService.verify).not.toHaveBeenCalled();

      testLogger.info('Token refresh with missing token test passed', {
        test: 'should fail token refresh with missing token',
      });
    });

    it('should fail token refresh with invalid token', async () => {
      // Arrange
      const refreshToken = 'invalid-refresh-token';

      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      const result = await authService.refreshToken(refreshToken);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Invalid refresh token',
      });

      expect(mockJwtService.verify).toHaveBeenCalledWith(refreshToken);

      testLogger.info('Token refresh with invalid token test passed', {
        test: 'should fail token refresh with invalid token',
      });
    });
  });

  describe('Email Verification', () => {
    it('should verify email successfully', async () => {
      // Arrange
      const verificationToken = 'valid-verification-token';
      const mockToken = {
        id: 1,
        user_id: 1,
        token: 'valid-verification-token',
        expires_at: new Date(Date.now() + 3600000),
        used: false,
      };

      mockDb.query.mockResolvedValue({ rows: [mockToken] });
      mockDb.query.mockResolvedValue({ rows: [{ id: 1 }] }); // Update user
      mockDb.query.mockResolvedValue({ rows: [{ id: 1 }] }); // Mark token as used

      // Act
      const result = await authService.verifyEmail(verificationToken);

      // Assert
      expect(result).toEqual({
        success: true,
        message: 'Email verified successfully',
      });

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM email_verification_tokens WHERE token = $1 AND used = false AND expires_at > NOW()',
        ['valid-verification-token']
      );

      testLogger.info('Email verification test passed', {
        test: 'should verify email successfully',
      });
    });

    it('should fail email verification with missing token', async () => {
      // Arrange
      const verificationToken = '';

      // Act
      const result = await authService.verifyEmail(verificationToken);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Verification token is required',
      });

      expect(mockDb.query).not.toHaveBeenCalled();

      testLogger.info('Email verification with missing token test passed', {
        test: 'should fail email verification with missing token',
      });
    });

    it('should fail email verification with invalid token', async () => {
      // Arrange
      const verificationToken = 'invalid-token';

      mockDb.query.mockResolvedValue({ rows: [] });

      // Act
      const result = await authService.verifyEmail(verificationToken);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Invalid or expired verification token',
      });

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM email_verification_tokens WHERE token = $1 AND used = false AND expires_at > NOW()',
        ['invalid-token']
      );

      testLogger.info('Email verification with invalid token test passed', {
        test: 'should fail email verification with invalid token',
      });
    });

    it('should resend verification email successfully', async () => {
      // Arrange
      const email = 'test@example.com';
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        is_verified: false,
      };

      mockDb.query.mockResolvedValue({ rows: [mockUser] });
      mockDb.query.mockResolvedValue({ rows: [{ id: 1 }] }); // Insert verification token
      mockEmailService.sendVerificationEmail.mockResolvedValue(true);

      // Act
      const result = await authService.resendVerification(email);

      // Assert
      expect(result).toEqual({
        success: true,
        message: 'Verification email sent',
      });

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1',
        ['test@example.com']
      );
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String)
      );

      testLogger.info('Resend verification email test passed', {
        test: 'should resend verification email successfully',
      });
    });

    it('should fail resend verification with missing email', async () => {
      // Arrange
      const email = '';

      // Act
      const result = await authService.resendVerification(email);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Email is required',
      });

      expect(mockDb.query).not.toHaveBeenCalled();

      testLogger.info('Resend verification with missing email test passed', {
        test: 'should fail resend verification with missing email',
      });
    });

    it('should fail resend verification with non-existent email', async () => {
      // Arrange
      const email = 'nonexistent@example.com';

      mockDb.query.mockResolvedValue({ rows: [] });

      // Act
      const result = await authService.resendVerification(email);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Email not found',
      });

      expect(mockEmailService.sendVerificationEmail).not.toHaveBeenCalled();

      testLogger.info(
        'Resend verification with non-existent email test passed',
        {
          test: 'should fail resend verification with non-existent email',
        }
      );
    });

    it('should fail resend verification with already verified email', async () => {
      // Arrange
      const email = 'test@example.com';
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        is_verified: true,
      };

      mockDb.query.mockResolvedValue({ rows: [mockUser] });

      // Act
      const result = await authService.resendVerification(email);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Email is already verified',
      });

      expect(mockEmailService.sendVerificationEmail).not.toHaveBeenCalled();

      testLogger.info(
        'Resend verification with already verified email test passed',
        {
          test: 'should fail resend verification with already verified email',
        }
      );
    });
  });

  describe('User Logout', () => {
    it('should logout successfully', async () => {
      // Arrange
      const userId = 1;
      const token = 'jwt-token';

      mockDb.query.mockResolvedValue({ rows: [{ id: 1 }] }); // Insert into blacklist

      // Act
      const result = await authService.logout(userId, token);

      // Assert
      expect(result).toEqual({
        success: true,
        message: 'Logged out successfully',
      });

      expect(mockDb.query).toHaveBeenCalledWith(
        'INSERT INTO token_blacklist (token, user_id, created_at) VALUES ($1, $2, NOW())',
        [token, userId]
      );

      testLogger.info('User logout test passed', {
        test: 'should logout successfully',
      });
    });

    it('should handle logout errors gracefully', async () => {
      // Arrange
      const userId = 1;
      const token = 'jwt-token';

      mockDb.query.mockRejectedValue(new Error('Database connection failed'));

      // Act
      const result = await authService.logout(userId, token);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Internal server error',
      });

      testLogger.info('Logout error handling test passed', {
        test: 'should handle logout errors gracefully',
      });
    });
  });
});
