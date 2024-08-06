import { Module } from '@nestjs/common';
import { MinioStorageService } from './minio.storage';
import { STORAGE_SERVICE } from './storage.interface';

@Module({
  providers: [
    MinioStorageService,
    {
      provide: STORAGE_SERVICE,
      useExisting: MinioStorageService,
    },
  ],
  exports: [STORAGE_SERVICE],
})
export class StorageModule {}
