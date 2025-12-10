import type { AuditTrailClient, ActiveSpan } from '../client';
import { completionEvent, promptEvent } from '../events';
import { redactSecrets } from '../redact';

export interface AnthropicMessageParams {
  model: string;
  max_tokens: number;
  messages: Array<{ role: string; content: string | unknown }>;
  [key: string]: unknown;
}

export interface AnthropicMessageResult {
  id?: string;
  model?: string;
  content?: Array<{ type: string; text?: string }>;
  usage?: { input_tokens?: number; output_tokens?: number };
  [key: string]: unknown;
}

export interface AnthropicClientLike {
  messages: {
    create(params: AnthropicMessageParams): Promise<AnthropicMessageResult>;
  };
}

/**
 * Wrap Anthropic messages.create and emit prompt/completion audit events.
 */
export function wrapAnthropicMessages(
  client: AuditTrailClient,
  anthropic: AnthropicClientLike,
  span: ActiveSpan,
): AnthropicClientLike {
  return {
    messages: {
      create: async (params) => {
        span.addEvent(promptEvent(span.spanId, redactSecrets({ ...params })));
        const result = await anthropic.messages.create(params);
        span.addEvent(
          completionEvent(
            span.spanId,
            redactSecrets({
              id: result.id,
              model: result.model ?? params.model,
              content: result.content,
              usage: result.usage,
            }),
          ),
        );
        await client.flush();
        return result;
      },
    },
  };
}
