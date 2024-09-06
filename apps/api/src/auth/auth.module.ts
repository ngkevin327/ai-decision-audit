import { Global, Module, forwardRef } from '@nestjs/common';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { AuthResolverService } from './auth-resolver.service';

@Global()
@Module({
  imports: [forwardRef(() => ApiKeysModule)],
  providers: [AuthResolverService],
  exports: [AuthResolverService],
})
export class AuthModule {}
