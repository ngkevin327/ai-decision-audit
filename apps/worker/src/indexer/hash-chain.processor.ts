import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { GENESIS_HASH, chainHash } from '@audit-trail/integrity';

export interface IndexedEventHashes {
  contentHash: string;
  chainHash: string;
}

@Injectable()
export class HashChainProcessor {
  verifyChain(events: IndexedEventHashes[]): string {
    let previous = GENESIS_HASH;

    for (const event of events) {
      const expected = chainHash(previous, event.contentHash);
      if (expected !== event.chainHash) {
        throw new UnprocessableEntityException('Event hash chain mismatch during indexing');
      }
      previous = event.chainHash;
    }

    return previous;
  }
}
