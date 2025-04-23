export const INDEXER_MAX_ATTEMPTS = 3;

export const INDEXER_RETRY_POLICY = {
  attempts: INDEXER_MAX_ATTEMPTS,
  backoff: {
    type: 'exponential' as const,
    delay: 1000,
  },
};
