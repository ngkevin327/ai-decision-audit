import { ArgumentsHost, BadRequestException, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const body = exception.getResponse();

    const payload =
      typeof body === 'object' && body !== null
        ? body
        : { message: String(body), code: 'VALIDATION_ERROR' };

    response.status(status).json({
      statusCode: status,
      ...payload,
    });
  }
}
