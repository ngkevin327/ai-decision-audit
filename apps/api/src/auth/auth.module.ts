import { Global, Module, forwardRef } from '@nestjs/common';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { AppConfigModule } from '../config/config.module';
import { AuthResolverService } from './auth-resolver.service';
import { ClerkAuthService } from './clerk-auth.service';
import { RolesGuard } from './roles.guard';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';

@Global()
@Module({
  imports: [AppConfigModule, forwardRef(() => ApiKeysModule)],
  controllers: [SessionController],
  providers: [ClerkAuthService, SessionService, AuthResolverService, RolesGuard],
  exports: [ClerkAuthService, SessionService, AuthResolverService, RolesGuard],
})
export class AuthModule {}
