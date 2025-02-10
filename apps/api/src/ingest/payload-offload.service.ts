import { Inject, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { STORAGE_SERVICE, type StorageService } from '../storage/storage.interface';
import { PAYLOAD_OFFLOAD_THRESHOLD_BYTES } from './ingest.constants';

@Injectable()
export class PayloadOffloadService {
  constructor(@Inject(STORAGE_SERVICE) private readonly storage: StorageService) {}

  async maybeOffload(
    organizationId: string,
    traceId: string,
    eventId: string,
    payload: unknown,
  ): Promise<{ payloadRef: string | null; inline: boolean }> {
    const serialized = JSON.stringify(payload ?? {});
    const size = Buffer.byteLength(serialized, 'utf8');

    if (size < PAYLOAD_OFFLOAD_THRESHOLD_BYTES) {
      return { payloadRef: null, inline: true };
    }

    const key = this.buildObjectKey(organizationId, traceId, eventId);
    await this.storage.put({
      key,
      body: serialized,
      contentType: 'application/json',
    });

    return { payloadRef: key, inline: false };
  }

  private buildObjectKey(organizationId: string, traceId: string, eventId: string): string {
    const hash = createHash('sha256').update(eventId).digest('hex').slice(0, 12);
    return `payloads/${organizationId}/${traceId}/${eventId}-${hash}.json`;
  }
}
