import { readFileSync } from 'fs';
import { join } from 'path';
import { getSchemaValidator } from '../src/validate';

const fixturesDir = join(__dirname, 'fixtures');

function loadFixture(name: string) {
  return JSON.parse(readFileSync(join(fixturesDir, name), 'utf-8'));
}

describe('Schema validation fixtures', () => {
  const validator = getSchemaValidator();

  it.each([
    ['valid-prompt.json', 'event'],
    ['valid-tool-call.json', 'event'],
  ])('accepts %s', (file) => {
    const payload = loadFixture(file);
    const result = validator.validateEvent(payload);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts a full trace ingest envelope', () => {
    const payload = loadFixture('valid-trace-envelope.json');
    const result = validator.validateTraceEnvelope(payload);
    expect(result.valid).toBe(true);
  });

  it('rejects envelope missing permission_snapshot', () => {
    const payload = loadFixture('invalid-missing-permission.json');
    const result = validator.validateTraceEnvelope(payload);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects tool_call without tool_name', () => {
    const payload = loadFixture('valid-tool-call.json');
    delete (payload.payload as Record<string, unknown>).tool_name;
    const result = validator.validateEvent(payload);
    expect(result.valid).toBe(false);
  });
});
