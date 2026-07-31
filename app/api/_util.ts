// Route handler'ların paylaştığı küçük yardımcılar.
// Alt çizgiyle başladığı ve route.ts olmadığı için bir endpoint üretmez.

import { db } from '@/lib/db';
import { getSession, type SessionUser } from '@/lib/session';
import { STATUSES, isKnownTrack } from '@/lib/config';
import type { Status, TaskRow, Track } from '@/lib/types';
import { getDict } from '@/lib/i18n/server';
import type { Dictionary } from '@/lib/i18n';

export function fail(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

/**
 * Dile duyarlı hata yanıtı. Mesajı seçici bir fonksiyonla veriyoruz ki anahtar
 * yolu TypeScript tarafından denetlensin — yazım hatası derlemede çıkar:
 *
 *   return failT((m) => m.task.notFound, 404);
 */
export async function failT(
  pick: (messages: Dictionary['api']) => string,
  status: number,
): Promise<Response> {
  const { t } = await getDict();
  return fail(pick(t.api), status);
}

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    const parsed: unknown = await request.json();
    if (parsed === null || typeof parsed !== 'object') return null;
    return parsed as T;
  } catch {
    return null;
  }
}

export type Guard = { user: SessionUser } | { response: Response };

export async function auth(): Promise<Guard> {
  const user = await getSession();
  if (!user) return { response: await failT((m) => m.session.missing, 401) };
  return { user };
}

/** Oturum + yönetici kontrolü tek adımda. Proxy'ye güvenmeyiz. */
export async function authAdmin(): Promise<Guard> {
  const result = await auth();
  if ('response' in result) return result;
  if (!result.user.isAdmin) {
    return { response: await failT((m) => m.session.adminRequired, 403) };
  }
  return result;
}

export function isStatus(value: unknown): value is Status {
  return typeof value === 'string' && (STATUSES as readonly string[]).includes(value);
}

/** Geçerli track'ler sprint.config.ts'ten gelir. */
export function isTrack(value: unknown): value is Track {
  return isKnownTrack(value);
}

/** Boş/whitespace metni null'a çevirir; string olmayan girdide undefined döner. */
export function optionalText(value: unknown): string | null | undefined {
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** TaskRow sözleşmesini üreten tek SELECT. Board ve tek görev yanıtları bunu paylaşır. */
const TASK_SELECT = `
  SELECT t.*,
         u.name AS assignee_name,
         COALESCE(ARRAY_AGG(DISTINCT l.label) FILTER (WHERE l.label IS NOT NULL), '{}') AS labels,
         (SELECT COUNT(*) FROM comments c WHERE c.task_id = t.id)::int AS comment_count
  FROM tasks t
  LEFT JOIN users u ON u.email = t.assignee
  LEFT JOIN task_labels l ON l.task_id = t.id
`;

export async function fetchTasks(): Promise<TaskRow[]> {
  const sql = db();
  const rows = await sql.query(
    `${TASK_SELECT} GROUP BY t.id, u.name ORDER BY t.day_no, t.sort_order, t.id`,
  );
  return rows as unknown as TaskRow[];
}

export async function fetchTask(id: number): Promise<TaskRow | null> {
  const sql = db();
  const rows = await sql.query(`${TASK_SELECT} WHERE t.id = $1 GROUP BY t.id, u.name`, [id]);
  return (rows as unknown as TaskRow[])[0] ?? null;
}
