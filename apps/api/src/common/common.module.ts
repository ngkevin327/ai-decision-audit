import { Global, Module } from '@nestjs/common';
import { NotFoundObfuscationFilter } from './filters/not-found-obfuscation.filter';
import { TenantScopeGuard } from './guards/tenant-scope.guard';
import { TenantContextMiddleware } from './middleware/tenant-context.middleware';
import { TenantContextService } from './tenant/tenant-context.service';

@Global()
@Module({
  providers: [
    TenantContextService,
    TenantContextMiddleware,
    TenantScopeGuard,
    NotFoundObfuscationFilter,
  ],
  exports: [
    TenantContextService,
    TenantContextMiddleware,
    TenantScopeGuard,
    NotFoundObfuscationFilter,
  ],
})
export class CommonModule {}
