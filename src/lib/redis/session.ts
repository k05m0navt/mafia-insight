import { redisClient } from './client';
import type { UserRole } from '@/types/navigation';

/**
 * Session data interface
 */
export interface SessionData {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: Date;
  createdAt: Date;
  expiresAt: Date;
}

/**
 * Session management service
 */
export class SessionService {
  private readonly SESSION_PREFIX = 'session:';
  private readonly SESSION_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

  /**
   * Create a new session
   */
  async createSession(
    sessionId: string,
    sessionData: SessionData
  ): Promise<void> {
    try {
      const key = `${this.SESSION_PREFIX}${sessionId}`;
      const data = {
        ...sessionData,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + this.SESSION_TTL * 1000).toISOString(),
      };

      await redisClient.setEx(key, this.SESSION_TTL, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to create session:', error);
      throw new Error('Session creation failed');
    }
  }

  /**
   * Get session data
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    try {
      const key = `${this.SESSION_PREFIX}${sessionId}`;
      const data = await redisClient.get(key);

      if (!data) {
        return null;
      }

      const sessionData = JSON.parse(data) as SessionData;

      // Check if session is expired
      if (new Date() > new Date(sessionData.expiresAt)) {
        await this.deleteSession(sessionId);
        return null;
      }

      return sessionData;
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }

  /**
   * Update session data
   */
  async updateSession(
    sessionId: string,
    updates: Partial<SessionData>
  ): Promise<void> {
    try {
      const existingSession = await this.getSession(sessionId);
      if (!existingSession) {
        throw new Error('Session not found');
      }

      const updatedSession = { ...existingSession, ...updates };
      await this.createSession(sessionId, updatedSession);
    } catch (error) {
      console.error('Failed to update session:', error);
      throw new Error('Session update failed');
    }
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      const key = `${this.SESSION_PREFIX}${sessionId}`;
      await redisClient.del(key);
    } catch (error) {
      console.error('Failed to delete session:', error);
      throw new Error('Session deletion failed');
    }
  }

  /**
   * Extend session expiration
   */
  async extendSession(sessionId: string): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const key = `${this.SESSION_PREFIX}${sessionId}`;
      await redisClient.expire(key, this.SESSION_TTL);
    } catch (error) {
      console.error('Failed to extend session:', error);
      throw new Error('Session extension failed');
    }
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string): Promise<SessionData[]> {
    try {
      const pattern = `${this.SESSION_PREFIX}*`;
      const keys = await redisClient.keys(pattern);
      const sessions: SessionData[] = [];

      for (const key of keys) {
        const data = await redisClient.get(key);
        if (data) {
          const session = JSON.parse(data) as SessionData;
          if (
            session.userId === userId &&
            new Date() < new Date(session.expiresAt)
          ) {
            sessions.push(session);
          }
        }
      }

      return sessions;
    } catch (error) {
      console.error('Failed to get user sessions:', error);
      return [];
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const pattern = `${this.SESSION_PREFIX}*`;
      const keys = await redisClient.keys(pattern);
      let cleanedCount = 0;

      for (const key of keys) {
        const data = await redisClient.get(key);
        if (data) {
          const session = JSON.parse(data) as SessionData;
          if (new Date() > new Date(session.expiresAt)) {
            await redisClient.del(key);
            cleanedCount++;
          }
        }
      }

      return cleanedCount;
    } catch (error) {
      console.error('Failed to cleanup expired sessions:', error);
      return 0;
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats(): Promise<{
    total: number;
    active: number;
    expired: number;
  }> {
    try {
      const pattern = `${this.SESSION_PREFIX}*`;
      const keys = await redisClient.keys(pattern);
      let total = 0;
      let active = 0;
      let expired = 0;

      for (const key of keys) {
        const data = await redisClient.get(key);
        if (data) {
          total++;
          const session = JSON.parse(data) as SessionData;
          if (new Date() > new Date(session.expiresAt)) {
            expired++;
          } else {
            active++;
          }
        }
      }

      return { total, active, expired };
    } catch (error) {
      console.error('Failed to get session stats:', error);
      return { total: 0, active: 0, expired: 0 };
    }
  }
}

/**
 * Singleton instance
 */
export const sessionService = new SessionService();
