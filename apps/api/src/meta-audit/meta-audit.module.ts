import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MetaAuditInterceptor } from './meta-audit.interceptor';
import { MetaAuditService } from './meta-audit.service';

@Module({
  providers: [
    MetaAuditService,
    {
      provide: APP_INTERCEPTOR,
      useClass: MetaAuditInterceptor,
    },
  ],
  exports: [MetaAuditService],
})
export class MetaAuditModule {}
