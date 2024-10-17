import { createHash } from 'crypto';
import { canonicalize } from './canonical-json';

export const CHAIN_ALGORITHM_VERSION = 1;
export const GENESIS_HASH = '0'.repeat(64);

export function contentHash(event: unknown): string {
  return sha256(canonicalize(event));
}

export function chainHash(previousHash: string, currentContentHash: string): string {
  return sha256(`${previousHash}${currentContentHash}`);
}

export function computeEventChain(events: unknown[]): {
  contentHashes: string[];
  chainHashes: string[];
} {
  const contentHashes: string[] = [];
  const chainHashes: string[] = [];
  let previous = GENESIS_HASH;

  for (const event of events) {
    const content = contentHash(event);
    const chain = chainHash(previous, content);
    contentHashes.push(content);
    chainHashes.push(chain);
    previous = chain;
  }

  return { contentHashes, chainHashes };
}

export function sealTrace(events: unknown[]): { finalChainHash: string; chainVersion: number } {
  const { chainHashes } = computeEventChain(events);
  return {
    finalChainHash: chainHashes.at(-1) ?? GENESIS_HASH,
    chainVersion: CHAIN_ALGORITHM_VERSION,
  };
}

function sha256(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}
