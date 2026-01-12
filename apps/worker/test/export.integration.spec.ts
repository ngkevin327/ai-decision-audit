import { createHash, createHmac } from 'crypto';
import { ManifestBuilder } from '../src/exports/manifest.builder';
import { PackageAssembler } from '../src/exports/package-assembler';

describe('export package pipeline', () => {
  it('builds manifest with chain hash and signature', () => {
    const builder = new ManifestBuilder('test-signing-secret');
    const manifest = builder.build({
      exportId: 'exp_123',
      organizationId: 'org_456',
      traces: [
        {
          trace_id: 'tr_1',
          workflow_name: 'support_flow',
          chain_hash: 'abc123',
          event_count: 2,
        },
      ],
    });

    expect(manifest.chain_hash).toHaveLength(64);
    expect(manifest.verification.manifest_signature).toHaveLength(64);
    expect(manifest.trace_count).toBe(1);
  });

  it('assembles zip with manifest and events jsonl', () => {
    const assembler = new PackageAssembler();
    const manifest = { schema_version: '1.0', export_id: 'exp_1', chain_hash: 'deadbeef' };
    const events = [
      { event_id: 'evt_1', chain_hash: 'a'.repeat(64) },
      { event_id: 'evt_2', chain_hash: 'b'.repeat(64) },
    ];

    const { zipBuffer, manifestHash } = assembler.assemble([
      { path: 'manifest.json', body: Buffer.from(JSON.stringify(manifest), 'utf8') },
      {
        path: 'events.jsonl',
        body: Buffer.from(events.map((e) => JSON.stringify(e)).join('\n'), 'utf8'),
      },
    ]);

    expect(zipBuffer.length).toBeGreaterThan(100);
    expect(zipBuffer.readUInt32LE(0)).toBe(0x04034b50);
    expect(manifestHash).toBe(createHash('sha256').update(JSON.stringify(manifest)).digest('hex'));
  });

  it('verifies manifest signature with signing secret', () => {
    const secret = 'integration-test-secret';
    const builder = new ManifestBuilder(secret);
    const manifest = builder.build({
      exportId: 'exp_verify',
      organizationId: 'org_verify',
      traces: [
        {
          trace_id: 'tr_verify',
          workflow_name: 'wf',
          chain_hash: 'c'.repeat(64),
          event_count: 1,
        },
      ],
    });

    const { manifest_signature, ...verificationRest } = manifest.verification;
    const unsigned = {
      ...manifest,
      verification: verificationRest,
    };
    const expected = createHmac('sha256', secret).update(JSON.stringify(unsigned)).digest('hex');

    expect(manifest_signature).toBe(expected);
    expect(builder.manifestHash(manifest)).toHaveLength(64);
  });
});
