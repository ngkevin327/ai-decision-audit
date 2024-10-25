import { readFileSync } from 'fs';
import { join } from 'path';
import { canonicalize } from './canonical-json';
import {
  CHAIN_ALGORITHM_VERSION,
  chainHash,
  computeEventChain,
  contentHash,
  GENESIS_HASH,
  sealTrace,
} from './hash-chain';

const fixturePath = join(__dirname, '../../test/fixtures/hash-chain.json');
const fixture = JSON.parse(readFileSync(fixturePath, 'utf-8')) as {
  events: unknown[];
  expected: { contentHashes: string[]; chainHashes: string[]; finalChainHash: string };
};

describe('canonical-json', () => {
  it('sorts object keys deterministically', () => {
    const input = { b: 1, a: { d: 2, c: 3 } };
    expect(canonicalize(input)).toBe('{"a":{"c":3,"d":2},"b":1}');
  });
});

describe('hash-chain', () => {
  const events = fixture.events;

  it('computes stable content hashes', () => {
    const first = contentHash(events[0]);
    const second = contentHash(events[0]);
    expect(first).toBe(second);
    expect(first).toHaveLength(64);
  });

  it('chains events from genesis hash', () => {
    const { chainHashes } = computeEventChain(events);
    expect(chainHashes[0]).toBe(chainHash(GENESIS_HASH, contentHash(events[0])));
    expect(chainHashes[1]).toBe(chainHash(chainHashes[0], contentHash(events[1])));
  });

  it('matches golden vectors', () => {
    const { contentHashes, chainHashes } = computeEventChain(events);
    expect(contentHashes).toEqual(fixture.expected.contentHashes);
    expect(chainHashes).toEqual(fixture.expected.chainHashes);
  });

  it('seals trace with algorithm version', () => {
    const seal = sealTrace(events);
    expect(seal.chainVersion).toBe(CHAIN_ALGORITHM_VERSION);
    expect(seal.finalChainHash).toBe(fixture.expected.finalChainHash);
  });
});
