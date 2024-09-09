import { Global, Module, forwardRef } from '@nestjs/common';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { AuthResolverService } from './auth-resolver.service';
import { RolesGuard } from './roles.guard';

@Global()
@Module({
  imports: [forwardRef(() => ApiKeysModule)],
  providers: [AuthResolverService, RolesGuard],
  exports: [AuthResolverService, RolesGuard],
})
export class AuthModule {}
