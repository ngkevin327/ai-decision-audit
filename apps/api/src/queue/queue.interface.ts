export interface QueueMessage<T = unknown> {
  id: string;
  payload: T;
}

export interface QueuePublishOptions {
  jobId?: string;
}

export interface QueueService {
  publish<T>(queueName: string, payload: T, options?: QueuePublishOptions): Promise<string>;
  ping(): Promise<boolean>;
}

export const QUEUE_SERVICE = Symbol('QUEUE_SERVICE');

export const INDEXER_QUEUE = 'indexer';
