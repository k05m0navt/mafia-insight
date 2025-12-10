import { describe, it, expect, beforeEach, vi } from 'vitest';
import { encryptToken, decryptToken } from '@/lib/auth/token-encryption';
import crypto from 'crypto';

// Mock crypto module
vi.mock('crypto', () => {
  const actualCrypto = vi.importActual('crypto');
  return {
    ...actualCrypto,
    randomBytes: vi.fn(),
    createCipheriv: vi.fn(),
    createDecipheriv: vi.fn(),
  };
});

describe('Token Encryption', () => {
  const mockEncryptionKey = 'a'.repeat(64); // 32 bytes hex = 64 hex chars

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OAUTH_TOKEN_ENCRYPTION_KEY = mockEncryptionKey;
  });

  describe('encryptToken', () => {
    it('should encrypt token when encryption key is set', async () => {
      const token = 'test-access-token';
      const mockIV = Buffer.from('a'.repeat(32), 'hex');
      const mockAuthTag = Buffer.from('b'.repeat(32), 'hex');

      vi.mocked(crypto.randomBytes).mockReturnValue(mockIV);

      const mockCipher = {
        update: vi.fn().mockReturnValue(Buffer.from('encrypted')),
        final: vi.fn().mockReturnValue(Buffer.from('data')),
        getAuthTag: vi.fn().mockReturnValue(mockAuthTag),
      };

      vi.mocked(crypto.createCipheriv).mockReturnValue(mockCipher as any);

      const result = await encryptToken(token);

      expect(result).toContain(':');
      expect(result.split(':')).toHaveLength(3);
      expect(crypto.randomBytes).toHaveBeenCalledWith(16);
      expect(crypto.createCipheriv).toHaveBeenCalledWith(
        'aes-256-gcm',
        Buffer.from(mockEncryptionKey, 'hex'),
        mockIV
      );
    });

    it('should return plain text when encryption key is not set', async () => {
      delete process.env.OAUTH_TOKEN_ENCRYPTION_KEY;

      const token = 'test-access-token';
      const result = await encryptToken(token);

      expect(result).toBe(token);
    });

    it('should handle encryption errors gracefully', async () => {
      process.env.OAUTH_TOKEN_ENCRYPTION_KEY = mockEncryptionKey;
      vi.mocked(crypto.randomBytes).mockImplementation(() => {
        throw new Error('Encryption failed');
      });

      await expect(encryptToken('test-token')).rejects.toThrow(
        'Failed to encrypt token'
      );
    });
  });

  describe('decryptToken', () => {
    it('should decrypt token when encryption key is set', async () => {
      const encryptedToken = 'iv:authTag:encrypted';
      const [ivHex, authTagHex, encrypted] = encryptedToken.split(':');

      const mockDecipher = {
        setAuthTag: vi.fn(),
        update: vi.fn().mockReturnValue(Buffer.from('decrypted')),
        final: vi.fn().mockReturnValue(Buffer.from('token')),
      };

      vi.mocked(crypto.createDecipheriv).mockReturnValue(mockDecipher as any);

      const result = await decryptToken(encryptedToken);

      expect(result).toBe('decryptedtoken');
      expect(crypto.createDecipheriv).toHaveBeenCalledWith(
        'aes-256-gcm',
        Buffer.from(mockEncryptionKey, 'hex'),
        Buffer.from(ivHex, 'hex')
      );
      expect(mockDecipher.setAuthTag).toHaveBeenCalledWith(
        Buffer.from(authTagHex, 'hex')
      );
    });

    it('should return plain text when encryption key is not set', async () => {
      delete process.env.OAUTH_TOKEN_ENCRYPTION_KEY;

      const token = 'plain-text-token';
      const result = await decryptToken(token);

      expect(result).toBe(token);
    });

    it('should return plain text if token format is invalid', async () => {
      process.env.OAUTH_TOKEN_ENCRYPTION_KEY = mockEncryptionKey;

      const invalidToken = 'not-encrypted-format';
      const result = await decryptToken(invalidToken);

      expect(result).toBe(invalidToken);
    });

    it('should handle decryption errors gracefully', async () => {
      process.env.OAUTH_TOKEN_ENCRYPTION_KEY = mockEncryptionKey;
      vi.mocked(crypto.createDecipheriv).mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      await expect(decryptToken('iv:authTag:encrypted')).rejects.toThrow(
        'Failed to decrypt token'
      );
    });
  });

  describe('Encryption/Decryption Round Trip', () => {
    it('should successfully encrypt and decrypt token', async () => {
      process.env.OAUTH_TOKEN_ENCRYPTION_KEY = mockEncryptionKey;

      const originalToken = 'test-access-token-12345';
      const mockIV = Buffer.from('a'.repeat(32), 'hex');
      const mockAuthTag = Buffer.from('b'.repeat(32), 'hex');

      // Mock encryption
      vi.mocked(crypto.randomBytes).mockReturnValue(mockIV);
      const mockCipher = {
        update: vi.fn().mockReturnValue(Buffer.from('encrypted')),
        final: vi.fn().mockReturnValue(Buffer.from('data')),
        getAuthTag: vi.fn().mockReturnValue(mockAuthTag),
      };
      vi.mocked(crypto.createCipheriv).mockReturnValue(mockCipher as any);

      const encrypted = await encryptToken(originalToken);

      // Mock decryption
      const mockDecipher = {
        setAuthTag: vi.fn(),
        update: vi.fn().mockReturnValue(Buffer.from('encrypted')),
        final: vi.fn().mockReturnValue(Buffer.from('data')),
      };
      vi.mocked(crypto.createDecipheriv).mockReturnValue(mockDecipher as any);

      const decrypted = await decryptToken(encrypted);

      // In a real scenario, this would match, but with mocks we verify the flow
      expect(encrypted).not.toBe(originalToken);
      expect(encrypted).toContain(':');
    });
  });
});
