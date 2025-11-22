export type MessageEnvelope<TPayload = unknown> = {
  topic: string;
  payload: TPayload;
  headers?: Record<string, string>;
  correlationId?: string;
  timestamp?: Date;
};

export interface MessageBusPort {
  publish<TPayload = unknown>(
    message: MessageEnvelope<TPayload>
  ): Promise<void>;
  subscribe(
    topic: string,
    handler: (message: MessageEnvelope) => Promise<void>
  ): Promise<void>;
  schedule<TPayload = unknown>(
    message: MessageEnvelope<TPayload>,
    options: { deliverAt: Date }
  ): Promise<void>;
}
