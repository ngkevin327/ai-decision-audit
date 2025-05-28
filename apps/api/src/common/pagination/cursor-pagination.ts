export interface TraceListCursor {
  startedAt: string;
  id: string;
}

export interface CursorPageResult<T> {
  items: T[];
  nextCursor: string | null;
}

export function encodeTraceCursor(cursor: TraceListCursor): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
}

export function decodeTraceCursor(encoded: string): TraceListCursor {
  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8'),
    ) as TraceListCursor;
    if (!parsed.startedAt || !parsed.id) {
      throw new Error('invalid cursor');
    }
    return parsed;
  } catch {
    throw new Error('invalid cursor');
  }
}

export function buildNextCursor<T extends { startedAt: Date; id: string }>(
  rows: T[],
  limit: number,
): string | null {
  if (rows.length <= limit) {
    return null;
  }
  const last = rows[limit - 1];
  return encodeTraceCursor({
    startedAt: last.startedAt.toISOString(),
    id: last.id,
  });
}
