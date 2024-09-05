import { Global, Module } from '@nestjs/common';
import { AuthResolverService } from './auth-resolver.service';

@Global()
@Module({
  providers: [AuthResolverService],
  exports: [AuthResolverService],
})
export class AuthModule {}
