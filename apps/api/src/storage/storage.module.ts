import { Module } from '@nestjs/common';
import { AppConfigService } from '../config/config.service';
import { MinioStorageService } from './minio.storage';
import { S3StorageService } from './s3.storage';
import { STORAGE_SERVICE } from './storage.interface';

@Module({
  providers: [
    MinioStorageService,
    S3StorageService,
    {
      provide: STORAGE_SERVICE,
      useFactory: (config: AppConfigService, minio: MinioStorageService, s3: S3StorageService) => {
        return config.storageDriver === 's3' ? s3 : minio;
      },
      inject: [AppConfigService, MinioStorageService, S3StorageService],
    },
  ],
  exports: [STORAGE_SERVICE],
})
export class StorageModule {}
