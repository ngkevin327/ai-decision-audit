import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(ForbiddenException)
export class NotFoundObfuscationFilter implements ExceptionFilter {
  catch(exception: ForbiddenException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { tenantMismatch?: boolean }>();

    if (this.shouldObfuscate(exception, request)) {
      response.status(404).json({
        statusCode: 404,
        message: 'Resource not found',
        error: 'Not Found',
      });
      return;
    }

    const status = exception.getStatus();
    response.status(status).json(exception.getResponse());
  }

  private shouldObfuscate(
    exception: ForbiddenException,
    request: Request & { tenantMismatch?: boolean },
  ): boolean {
    if (request.tenantMismatch) {
      return true;
    }

    const message = exception.message?.toLowerCase() ?? '';
    return (
      message.includes('another organization') ||
      message.includes('cross-tenant') ||
      message.includes('tenant')
    );
  }
}
