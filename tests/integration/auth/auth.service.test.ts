import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { testLogger } from '../../utils/logging/TestLogger';

// Mock the auth service module
const mockAuthService = {
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  validateToken: vi.fn(),
  refreshToken: vi.fn(),
  verifyEmail: vi.fn(),
  resendVerification: vi.fn(),
};

// Mock the database connection
const mockDb = {
  query: vi.fn(),
  transaction: vi.fn(),
};

// Mock the email service
const mockEmailService = {
  sendPasswordResetEmail: vi.fn(),
  sendVerificationEmail: vi.fn(),
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

describe('Authentication Service Integration Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Setup default mock implementations
    mockPasswordService.hash.mockResolvedValue('hashed-password');
    mockPasswordService.compare.mockResolvedValue(true);
    mockPasswordService.validateStrength.mockReturnValue({
      isValid: true,
      score: 4,
    });

    mockJwtService.generate.mockReturnValue('jwt-token');
    mockJwtService.verify.mockReturnValue({
      userId: 1,
      email: 'test@example.com',
    });
    mockJwtService.refresh.mockReturnValue('new-jwt-token');

    mockEmailService.sendPasswordResetEmail.mockResolvedValue(true);
    mockEmailService.sendVerificationEmail.mockResolvedValue(true);

    testLogger.info('Starting authentication service integration test', {
      test: 'Authentication Service Integration Tests',
    });
  });

  afterEach(() => {
    testLogger.info('Completed authentication service integration test', {
      test: 'Authentication Service Integration Tests',
    });
  });

  describe('User Login', () => {
    it('should login successfully with valid credentials', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed-password',
        isVerified: true,
        isActive: true,
      };

      mockDb.query.mockResolvedValue({ rows: [mockUser] });
      mockPasswordService.compare.mockResolvedValue(true);
      mockJwtService.generate.mockReturnValue('jwt-token');

      // Act
      const result = await mockAuthService.login(loginData);

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

    it('should fail login with invalid email', async () => {
      // Arrange
      const loginData = {
        email: 'invalid@example.com',
        password: 'password123',
      };

      mockDb.query.mockResolvedValue({ rows: [] });

      // Act
      const result = await mockAuthService.login(loginData);

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
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed-password',
        isVerified: true,
        isActive: true,
      };

      mockDb.query.mockResolvedValue({ rows: [mockUser] });
      mockPasswordService.compare.mockResolvedValue(false);

      // Act
      const result = await mockAuthService.login(loginData);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Invalid email or password',
      });

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1 AND is_active = true',
        ['test@example.com']
      );
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
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed-password',
        isVerified: false,
        isActive: true,
      };

      mockDb.query.mockResolvedValue({ rows: [mockUser] });
      mockPasswordService.compare.mockResolvedValue(true);

      // Act
      const result = await mockAuthService.login(loginData);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Please verify your email before logging in',
      });

      testLogger.info('Login with unverified account test passed', {
        test: 'should fail login with unverified account',
      });
    });

    it('should fail login with inactive account', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed-password',
        isVerified: true,
        isActive: false,
      };

      mockDb.query.mockResolvedValue({ rows: [mockUser] });
      mockPasswordService.compare.mockResolvedValue(true);

      // Act
      const result = await mockAuthService.login(loginData);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Account is inactive',
      });

      testLogger.info('Login with inactive account test passed', {
        test: 'should fail login with inactive account',
      });
    });

    it('should handle database errors during login', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockDb.query.mockRejectedValue(new Error('Database connection failed'));

      // Act
      const result = await mockAuthService.login(loginData);

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
      const registrationData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password123',
      };

      mockDb.query.mockResolvedValue({ rows: [] }); // No existing user
      mockPasswordService.validateStrength.mockReturnValue({
        isValid: true,
        score: 4,
      });
      mockPasswordService.hash.mockResolvedValue('hashed-password');
      mockDb.query.mockResolvedValueOnce({ rows: [] }); // Check existing user
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Insert user
      mockJwtService.generate.mockReturnValue('jwt-token');
      mockEmailService.sendVerificationEmail.mockResolvedValue(true);

      // Act
      const result = await mockAuthService.register(registrationData);

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
        'john.doe@example.com'
      );

      testLogger.info('Registration with valid data test passed', {
        test: 'should register successfully with valid data',
      });
    });

    it('should fail registration with existing email', async () => {
      // Arrange
      const registrationData = {
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
      const result = await mockAuthService.register(registrationData);

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

    it('should fail registration with weak password', async () => {
      // Arrange
      const registrationData = {
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
      const result = await mockAuthService.register(registrationData);

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

    it('should handle database errors during registration', async () => {
      // Arrange
      const registrationData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password123',
      };

      mockDb.query.mockResolvedValue({ rows: [] }); // No existing user
      mockPasswordService.validateStrength.mockReturnValue({
        isValid: true,
        score: 4,
      });
      mockPasswordService.hash.mockResolvedValue('hashed-password');
      mockDb.query.mockRejectedValue(new Error('Database connection failed'));

      // Act
      const result = await mockAuthService.register(registrationData);

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
      const result = await mockAuthService.forgotPassword(email);

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

    it('should fail password reset with non-existent email', async () => {
      // Arrange
      const email = 'nonexistent@example.com';

      mockDb.query.mockResolvedValue({ rows: [] });

      // Act
      const result = await mockAuthService.forgotPassword(email);

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
      });
      mockPasswordService.hash.mockResolvedValue('hashed-new-password');
      mockDb.query.mockResolvedValue({ rows: [{ id: 1 }] }); // Update password
      mockDb.query.mockResolvedValue({ rows: [{ id: 1 }] }); // Mark token as used

      // Act
      const result = await mockAuthService.resetPassword(resetData);

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

    it('should fail password reset with invalid token', async () => {
      // Arrange
      const resetData = {
        token: 'invalid-token',
        newPassword: 'newpassword123',
      };

      mockDb.query.mockResolvedValue({ rows: [] });

      // Act
      const result = await mockAuthService.resetPassword(resetData);

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

    it('should fail password reset with expired token', async () => {
      // Arrange
      const resetData = {
        token: 'expired-token',
        newPassword: 'newpassword123',
      };

      const expiredToken = {
        id: 1,
        user_id: 1,
        token: 'expired-token',
        expires_at: new Date(Date.now() - 3600000), // 1 hour ago
        used: false,
      };

      mockDb.query.mockResolvedValue({ rows: [expiredToken] });

      // Act
      const result = await mockAuthService.resetPassword(resetData);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Invalid or expired reset token',
      });

      testLogger.info('Password reset with expired token test passed', {
        test: 'should fail password reset with expired token',
      });
    });
  });

  describe('Token Management', () => {
    it('should validate token successfully', async () => {
      // Arrange
      const token = 'valid-jwt-token';
      const decodedToken = { userId: 1, email: 'test@example.com' };

      mockJwtService.verify.mockReturnValue(decodedToken);
      mockDb.query.mockResolvedValue({ rows: [{ id: 1, is_active: true }] });

      // Act
      const result = await mockAuthService.validateToken(token);

      // Assert
      expect(result).toEqual({
        success: true,
        user: { id: 1, email: 'test@example.com' },
      });

      expect(mockJwtService.verify).toHaveBeenCalledWith(token);
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT id, is_active FROM users WHERE id = $1',
        [1]
      );

      testLogger.info('Token validation test passed', {
        test: 'should validate token successfully',
      });
    });

    it('should fail token validation with invalid token', async () => {
      // Arrange
      const token = 'invalid-jwt-token';

      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      const result = await mockAuthService.validateToken(token);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Invalid token',
      });

      expect(mockJwtService.verify).toHaveBeenCalledWith(token);
      expect(mockDb.query).not.toHaveBeenCalled();

      testLogger.info('Invalid token validation test passed', {
        test: 'should fail token validation with invalid token',
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
      const result = await mockAuthService.refreshToken(refreshToken);

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
      const result = await mockAuthService.verifyEmail(verificationToken);

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
      const result = await mockAuthService.resendVerification(email);

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
  });

  describe('User Logout', () => {
    it('should logout successfully', async () => {
      // Arrange
      const userId = 1;
      const token = 'jwt-token';

      mockDb.query.mockResolvedValue({ rows: [{ id: 1 }] }); // Insert into blacklist

      // Act
      const result = await mockAuthService.logout(userId, token);

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
      const result = await mockAuthService.logout(userId, token);

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
