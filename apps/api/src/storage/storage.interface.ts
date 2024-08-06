export interface PutObjectInput {
  key: string;
  body: Buffer | string;
  contentType?: string;
}

export interface StorageObject {
  key: string;
  body: Buffer;
  contentType?: string;
}

export interface StorageService {
  put(input: PutObjectInput): Promise<void>;
  get(key: string): Promise<StorageObject>;
  signedUrl(key: string, expiresInSeconds?: number): Promise<string>;
}

export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');
