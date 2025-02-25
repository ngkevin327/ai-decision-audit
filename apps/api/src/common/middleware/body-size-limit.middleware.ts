import { Injectable, NestMiddleware, PayloadTooLargeException } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { INGEST_MAX_BODY_BYTES } from '../../ingest/ingest.constants';

@Injectable()
export class BodySizeLimitMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    if (!req.path.startsWith('/v1/traces')) {
      return next();
    }

    const contentLength = Number(req.headers['content-length'] ?? 0);
    if (contentLength > INGEST_MAX_BODY_BYTES) {
      throw new PayloadTooLargeException({
        message: `Request body exceeds ${INGEST_MAX_BODY_BYTES} bytes`,
        code: 'PAYLOAD_TOO_LARGE',
      });
    }

    return next();
  }
}
