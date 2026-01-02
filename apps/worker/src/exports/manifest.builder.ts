import { createHmac, createHash } from 'crypto';

export interface ManifestTraceEntry {
  trace_id: string;
  workflow_name: string;
  chain_hash: string | null;
  event_count: number;
}

export interface ExportManifest {
  schema_version: string;
  export_id: string;
  organization_id: string;
  generated_at: string;
  chain_hash: string;
  trace_count: number;
  traces: ManifestTraceEntry[];
  verification: {
    algorithm: string;
    instructions: string;
    manifest_signature: string;
  };
}

export class ManifestBuilder {
  constructor(private readonly signingSecret: string) {}

  build(input: {
    exportId: string;
    organizationId: string;
    traces: ManifestTraceEntry[];
  }): ExportManifest {
    const chainHash = this.aggregateChainHash(input.traces);
    const manifestWithoutSig: Omit<ExportManifest, 'verification'> & {
      verification: Omit<ExportManifest['verification'], 'manifest_signature'>;
    } = {
      schema_version: '1.0',
      export_id: input.exportId,
      organization_id: input.organizationId,
      generated_at: new Date().toISOString(),
      chain_hash: chainHash,
      trace_count: input.traces.length,
      traces: input.traces,
      verification: {
        algorithm: 'hmac-sha256',
        instructions:
          'Recompute event chain hashes with @audit-trail/integrity, compare trace chain_hash fields, then verify manifest_signature using your platform signing secret.',
      },
    };

    const canonical = JSON.stringify(manifestWithoutSig);
    const manifest_signature = createHmac('sha256', this.signingSecret)
      .update(canonical)
      .digest('hex');

    return {
      ...manifestWithoutSig,
      verification: {
        ...manifestWithoutSig.verification,
        manifest_signature,
      },
    };
  }

  manifestHash(manifest: ExportManifest): string {
    return createHash('sha256').update(JSON.stringify(manifest)).digest('hex');
  }

  private aggregateChainHash(traces: ManifestTraceEntry[]): string {
    const parts = traces.map((t) => t.chain_hash ?? '0'.repeat(64));
    return createHash('sha256').update(parts.join('')).digest('hex');
  }
}
