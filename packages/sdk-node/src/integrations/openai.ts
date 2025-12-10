import type { AuditTrailClient, ActiveSpan } from '../client';
import { completionEvent, promptEvent } from '../events';
import { redactSecrets } from '../redact';

export interface OpenAIChatCompletionParams {
  model: string;
  messages: Array<{ role: string; content: string | null }>;
  [key: string]: unknown;
}

export interface OpenAIChatCompletionResult {
  id?: string;
  model?: string;
  choices?: Array<{
    index?: number;
    message?: { role?: string; content?: string | null };
    finish_reason?: string | null;
  }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  [key: string]: unknown;
}

export interface OpenAIClientLike {
  chat: {
    completions: {
      create(params: OpenAIChatCompletionParams): Promise<OpenAIChatCompletionResult>;
    };
  };
}

/**
 * Wrap OpenAI chat.completions.create and emit prompt/completion audit events.
 */
export function wrapOpenAIChatCompletions(
  client: AuditTrailClient,
  openai: OpenAIClientLike,
  span: ActiveSpan,
): OpenAIClientLike {
  return {
    chat: {
      completions: {
        create: async (params) => {
          span.addEvent(promptEvent(span.spanId, redactSecrets({ ...params })));
          const result = await openai.chat.completions.create(params);
          span.addEvent(
            completionEvent(
              span.spanId,
              redactSecrets({
                id: result.id,
                model: result.model ?? params.model,
                choices: result.choices,
                usage: result.usage,
              }),
            ),
          );
          await client.flush();
          return result;
        },
      },
    },
  };
}
