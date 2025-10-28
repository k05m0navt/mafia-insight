import { createSupabaseClient } from '../supabase/client';
import type {
  BaseError,
  AuthenticationError as AuthError,
} from '../types/error';
import { randomUUID } from 'crypto';

/**
 * Error tracking configuration
 */
interface ErrorTrackingConfig {
  enabled: boolean;
  logToConsole: boolean;
  logToDatabase: boolean;
  environment: string;
}

/**
 * Error tracking service for monitoring and logging errors
 */
class ErrorTrackingService {
  private config: ErrorTrackingConfig;
  private supabase = createSupabaseClient();

  constructor() {
    this.config = {
      enabled: process.env.NODE_ENV !== 'test',
      logToConsole: process.env.NODE_ENV === 'development',
      logToDatabase: true,
      environment: process.env.NODE_ENV || 'development',
    };
  }

  /**
   * Track an error
   */
  async trackError(
    error: BaseError,
    context?: Record<string, unknown>
  ): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    // Log to console in development
    if (this.config.logToConsole) {
      console.error('Error tracked:', {
        error,
        context,
        timestamp: new Date().toISOString(),
      });
    }

    // Log to database
    if (this.config.logToDatabase && 'userId' in error && 'action' in error) {
      await this.logAuthenticationError(error as AuthError, context);
    }
  }

  /**
   * Log authentication error to database
   */
  private async logAuthenticationError(
    error: AuthError,
    context?: Record<string, unknown>
  ): Promise<void> {
    try {
      const { error: dbError } = await this.supabase
        .from('authentication_errors')
        .insert({
          id: randomUUID(),
          userId: error.userId,
          errorCode: error.code,
          userMessage: error.userMessage || error.message,
          action: error.action,
          context: context || {},
          resolved: false,
          createdAt: new Date().toISOString(),
        });

      if (dbError) {
        console.error('Failed to log authentication error:', dbError);
      }
    } catch (err) {
      console.error('Error tracking service failed:', err);
    }
  }

  /**
   * Mark an error as resolved
   */
  async markErrorResolved(errorId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('authentication_errors')
        .update({ resolved: true })
        .eq('id', errorId);

      if (error) {
        console.error('Failed to mark error as resolved:', error);
      }
    } catch (err) {
      console.error('Error tracking service failed:', err);
    }
  }

  /**
   * Get error statistics
   */
  async getErrorStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    total: number;
    unresolved: number;
    byAction: Record<string, number>;
  }> {
    try {
      let query = this.supabase.from('authentication_errors').select('*');

      if (startDate) {
        query = query.gte('createdAt', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('createdAt', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to get error stats:', error);
        return { total: 0, unresolved: 0, byAction: {} };
      }

      const total = data?.length || 0;
      const unresolved = data?.filter((e) => !e.resolved).length || 0;
      const byAction: Record<string, number> = {};

      data?.forEach((error) => {
        byAction[error.action] = (byAction[error.action] || 0) + 1;
      });

      return { total, unresolved, byAction };
    } catch (err) {
      console.error('Error tracking service failed:', err);
      return { total: 0, unresolved: 0, byAction: {} };
    }
  }
}

/**
 * Singleton instance
 */
export const errorTrackingService = new ErrorTrackingService();
