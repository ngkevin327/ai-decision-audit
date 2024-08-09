import { Injectable } from '@nestjs/common';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AppConfigService } from '../config/config.service';
import type { PutObjectInput, StorageObject, StorageService } from './storage.interface';

@Injectable()
export class S3StorageService implements StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: AppConfigService) {
    const region = config.env.AWS_REGION ?? 'us-east-1';
    this.bucket = config.env.S3_BUCKET ?? 'audit-payloads';
    this.client = new S3Client({ region });
  }

  async put(input: PutObjectInput): Promise<void> {
    const body = typeof input.body === 'string' ? Buffer.from(input.body) : input.body;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
        Body: body,
        ContentType: input.contentType ?? 'application/octet-stream',
      }),
    );
  }

  async get(key: string): Promise<StorageObject> {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    const bytes = await response.Body?.transformToByteArray();
    return {
      key,
      body: Buffer.from(bytes ?? []),
      contentType: response.ContentType,
    };
  }

  async signedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: expiresInSeconds },
    );
  }
}
