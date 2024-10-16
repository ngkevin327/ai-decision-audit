import { BadRequestException, Injectable } from '@nestjs/common';
import {
  getSchemaValidator,
  type TraceIngestEnvelope,
  type ValidationIssue,
} from '@audit-trail/schema';

@Injectable()
export class SchemaValidationService {
  private readonly validator = getSchemaValidator();

  validateTraceEnvelope(payload: unknown): TraceIngestEnvelope {
    const result = this.validator.validateTraceEnvelope(payload);
    if (!result.valid) {
      throw new BadRequestException({
        message: 'Trace envelope failed schema validation',
        errors: this.formatIssues(result.errors),
      });
    }
    return result.data!;
  }

  private formatIssues(issues: ValidationIssue[]) {
    return issues.map((issue) => ({
      pointer: issue.path || '/',
      message: issue.message,
    }));
  }
}
