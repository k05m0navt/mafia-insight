import crypto from 'crypto';

/**
 * Encryption key from environment variable
 * In production, use a secure key management service
 */
const ALGORITHM = 'aes-256-gcm';

/**
 * Get encryption key from environment variable (checked dynamically)
 */
function getEncryptionKey(): string {
  return process.env.OAUTH_TOKEN_ENCRYPTION_KEY || '';
}

/**
 * Encrypt OAuth token before storing in database
 */
export async function encryptToken(token: string): Promise<string> {
  const encryptionKey = getEncryptionKey();

  if (!encryptionKey) {
    console.warn(
      '[OAuth] OAUTH_TOKEN_ENCRYPTION_KEY not set, tokens will be stored in plain text (NOT RECOMMENDED)'
    );
    return token; // Fallback to plain text if key not set (NOT SECURE)
  }

  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      ALGORITHM,
      Buffer.from(encryptionKey, 'hex'),
      iv
    );

    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return IV + authTag + encrypted data (all hex encoded)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('[OAuth] Token encryption error:', error);
    throw new Error('Failed to encrypt token');
  }
}

/**
 * Decrypt OAuth token from database
 */
export async function decryptToken(encryptedToken: string): Promise<string> {
  const encryptionKey = getEncryptionKey();

  if (!encryptionKey) {
    // If no encryption key, assume token is stored in plain text
    return encryptedToken;
  }

  try {
    const parts = encryptedToken.split(':');
    if (parts.length !== 3) {
      // If format doesn't match encrypted format, assume plain text
      return encryptedToken;
    }

    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(encryptionKey, 'hex'),
      iv
    );

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('[OAuth] Token decryption error:', error);
    throw new Error('Failed to decrypt token');
  }
}
