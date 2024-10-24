import Ajv, { type ErrorObject, type ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { TraceEvent, TraceIngestEnvelope } from './types';

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidationResult<T> {
  valid: boolean;
  data?: T;
  errors: ValidationIssue[];
}

const schemaDir = join(__dirname, '../schemas/v1');

function loadSchema(filename: string) {
  return JSON.parse(readFileSync(join(schemaDir, filename), 'utf-8'));
}

function formatErrors(errors: ErrorObject[] | null | undefined): ValidationIssue[] {
  if (!errors?.length) return [];
  return errors.map((err) => ({
    path: err.instancePath || '/',
    message: err.message ?? 'validation failed',
  }));
}

export class SchemaValidator {
  private readonly ajv: Ajv;
  private readonly validateEnvelopeFn: ValidateFunction<TraceIngestEnvelope>;
  private readonly validateEventFn: ValidateFunction<TraceEvent>;

  constructor() {
    this.ajv = new Ajv({ allErrors: true, strict: false, validateSchema: false });
    addFormats(this.ajv);

    this.ajv.addSchema(loadSchema('actor.schema.json'));
    this.ajv.addSchema(loadSchema('permission-snapshot.schema.json'));
    this.ajv.addSchema(loadSchema('event.schema.json'));
    this.ajv.addSchema(loadSchema('trace-envelope.schema.json'));

    const envelope = this.ajv.getSchema(
      'https://audit-trail.dev/schemas/v1/trace-envelope.schema.json',
    );
    const event = this.ajv.getSchema('https://audit-trail.dev/schemas/v1/event.schema.json');

    if (!envelope || !event) {
      throw new Error('Failed to compile JSON Schema validators');
    }

    this.validateEnvelopeFn = envelope as ValidateFunction<TraceIngestEnvelope>;
    this.validateEventFn = event as ValidateFunction<TraceEvent>;
  }

  validateTraceEnvelope(payload: unknown): ValidationResult<TraceIngestEnvelope> {
    const valid = this.validateEnvelopeFn(payload);
    return {
      valid: Boolean(valid),
      data: valid ? (payload as TraceIngestEnvelope) : undefined,
      errors: formatErrors(this.validateEnvelopeFn.errors),
    };
  }

  validateEvent(payload: unknown): ValidationResult<TraceEvent> {
    const valid = this.validateEventFn(payload);
    return {
      valid: Boolean(valid),
      data: valid ? (payload as TraceEvent) : undefined,
      errors: formatErrors(this.validateEventFn.errors),
    };
  }
}

let sharedValidator: SchemaValidator | undefined;

export function getSchemaValidator(): SchemaValidator {
  if (!sharedValidator) {
    sharedValidator = new SchemaValidator();
  }
  return sharedValidator;
}
