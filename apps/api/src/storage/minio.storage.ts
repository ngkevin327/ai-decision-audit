import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';
import { AppConfigService } from '../config/config.service';
import type { PutObjectInput, StorageObject, StorageService } from './storage.interface';

@Injectable()
export class MinioStorageService implements StorageService, OnModuleInit {
  private client!: Minio.Client;

  constructor(private readonly config: AppConfigService) {}

  async onModuleInit() {
    const { env } = this.config;
    this.client = new Minio.Client({
      endPoint: env.MINIO_ENDPOINT,
      port: env.MINIO_PORT,
      useSSL: env.MINIO_USE_SSL,
      accessKey: env.MINIO_ACCESS_KEY,
      secretKey: env.MINIO_SECRET_KEY,
    });

    const exists = await this.client.bucketExists(env.MINIO_BUCKET);
    if (!exists) {
      try {
        await this.client.makeBucket(env.MINIO_BUCKET);
      } catch (error) {
        const code = (error as { code?: string })?.code;
        if (code !== 'BucketAlreadyOwnedByYou' && code !== 'BucketAlreadyExists') {
          throw error;
        }
      }
    }
  }

  async put(input: PutObjectInput): Promise<void> {
    const body = typeof input.body === 'string' ? Buffer.from(input.body) : input.body;
    await this.client.putObject(this.config.env.MINIO_BUCKET, input.key, body, body.length, {
      'Content-Type': input.contentType ?? 'application/octet-stream',
    });
  }

  async get(key: string): Promise<StorageObject> {
    const stream = await this.client.getObject(this.config.env.MINIO_BUCKET, key);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return { key, body: Buffer.concat(chunks) };
  }

  async signedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    return this.client.presignedGetObject(this.config.env.MINIO_BUCKET, key, expiresInSeconds);
  }
}
