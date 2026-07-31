import { db } from '@/lib/db';
import type { ActivityRow } from '@/lib/types';
import { auth, failT, normalizeEmail } from '../_util';

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

function parseLimit(raw: string | null): number {
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 1) return DEFAULT_LIMIT;
  return Math.min(Math.trunc(value), MAX_LIMIT);
}

/** Aktivite akışını herkes görebilir — şeffaflık kararı. */
export async function GET(request: Request): Promise<Response> {
  const guard = await auth();
  if ('response' in guard) return guard.response;

  const query = new URL(request.url).searchParams;
  const limit = parseLimit(query.get('limit'));
  const actor = normalizeEmail(query.get('actor')) || null;
  const action = (query.get('action') ?? '').trim() || null;

  try {
    const sql = db();
    const rows = (await sql`
      SELECT a.id,
             a.actor,
             u.name AS actor_name,
             a.action,
             a.task_id,
             a.task_code,
             a.from_value,
             a.to_value,
             a.note,
             a.created_at
      FROM activity_log a
      LEFT JOIN users u ON u.email = a.actor
      WHERE (${actor}::text IS NULL OR a.actor = ${actor})
        AND (${action}::text IS NULL OR a.action = ${action})
      ORDER BY a.created_at DESC, a.id DESC
      LIMIT ${limit}
    `) as unknown as ActivityRow[];

    return Response.json(rows);
  } catch {
    return failT((m) => m.activity.readFailed, 500);
  }
}
