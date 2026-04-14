import { Body, Controller, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { LinkSessionDto } from './dto/link-session.dto';
import { SessionService } from './session.service';

@Controller('public/auth')
export class SessionController {
  constructor(private readonly sessions: SessionService) {}

  @Post('session')
  async linkSession(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: LinkSessionDto,
  ) {
    const token = extractBearer(authorization);
    if (!token) {
      throw new UnauthorizedException('Bearer token required');
    }
    return this.sessions.linkClerkUser(token, body);
  }
}

function extractBearer(authorization: string | undefined): string | null {
  if (!authorization?.startsWith('Bearer ')) return null;
  const token = authorization.slice(7).trim();
  return token.length > 0 ? token : null;
}
