import type {
  MessageBusPort,
  MessageEnvelope,
} from '@/application/ports/messaging';
import {
  createServiceRoleClient,
  createSupabaseClient,
} from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

type Handler = (message: MessageEnvelope) => Promise<void>;

export class SupabaseMessageBusAdapter implements MessageBusPort {
  private readonly client: SupabaseClient | null;
  private readonly subscriptions = new Map<string, Set<Handler>>();
  private readonly pendingTimers = new Set<NodeJS.Timeout>();

  constructor(client?: SupabaseClient | null) {
    this.client = client ?? this.tryCreateClient();
  }

  async publish<TPayload = unknown>(
    message: MessageEnvelope<TPayload>
  ): Promise<void> {
    await this.dispatchLocal(message);

    if (!this.client) {
      return;
    }

    try {
      await this.client.from('architecture_events').insert({
        topic: message.topic,
        payload: message.payload,
        headers: message.headers ?? null,
        correlation_id: message.correlationId ?? null,
        published_at: new Date().toISOString(),
      });
    } catch (error) {
      console.warn(
        '[SupabaseMessageBusAdapter] Unable to persist event to Supabase:',
        error
      );
    }
  }

  async subscribe(topic: string, handler: Handler): Promise<void> {
    const handlers = this.subscriptions.get(topic) ?? new Set<Handler>();
    handlers.add(handler);
    this.subscriptions.set(topic, handlers);
  }

  async schedule<TPayload = unknown>(
    message: MessageEnvelope<TPayload>,
    options: { deliverAt: Date }
  ): Promise<void> {
    const delay = Math.max(options.deliverAt.getTime() - Date.now(), 0);

    await new Promise<void>((resolve) => {
      const timer = setTimeout(async () => {
        this.pendingTimers.delete(timer);
        await this.publish(message);
        resolve();
      }, delay);

      this.pendingTimers.add(timer);
    });
  }

  /**
   * Used by tests to clear any outstanding scheduled work.
   */
  dispose(): void {
    for (const timer of this.pendingTimers) {
      clearTimeout(timer);
    }
    this.pendingTimers.clear();
  }

  private async dispatchLocal(message: MessageEnvelope): Promise<void> {
    const handlers = this.subscriptions.get(message.topic);
    if (!handlers || handlers.size === 0) {
      return;
    }

    await Promise.all(
      Array.from(handlers).map(async (handler) => handler(message))
    );
  }

  private tryCreateClient(): SupabaseClient | null {
    try {
      return createServiceRoleClient();
    } catch {
      try {
        return createSupabaseClient();
      } catch {
        return null;
      }
    }
  }
}
