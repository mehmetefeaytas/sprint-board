// Ekranların sunucu tarafı veri katmanı. Sadece OKUMA yapar; her mutasyon
// istemciden /api/* üzerinden gider. Kendi origin'ine fetch atıp cookie
// taşımak yerine doğrudan Neon'a sorulur.

import { db } from '@/lib/db';
import { DEFAULT_TRACK, STATUSES, TRACKS } from '@/lib/config';
import type {
  ActivityRow,
  BoardPayload,
  CommentRow,
  DayRow,
  Status,
  TaskRow,
  Track,
  UserRow,
} from '@/lib/types';
import type { SessionUser } from '@/lib/session';
import type { Dictionary } from '@/lib/i18n';

type Row = Record<string, unknown>;

// Not: timestamptz alanları SQL tarafında ISO 8601 metnine çevrilir; Neon
// sürücüsünün Date nesnesine dönüştürmesine güvenilmez.

function text(value: unknown): string {
  return value == null ? '' : String(value);
}

function textOrNull(value: unknown): string | null {
  return value == null ? null : String(value);
}

function int(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function flag(value: unknown): boolean {
  return value === true || value === 'true' || value === 't' || value === 1;
}

function asTrack(value: unknown): Track {
  const found = TRACKS.find((t) => t === value);
  return found ?? DEFAULT_TRACK;
}

function asTrackOrNull(value: unknown): Track | null {
  return TRACKS.find((t) => t === value) ?? null;
}

function asStatus(value: unknown): Status {
  return STATUSES.find((s) => s === value) ?? 'todo';
}

/** text[] hem JS dizisi hem '{a,b}' metni olarak gelebilir. */
function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v) => v != null).map((v) => String(v));
  if (typeof value === 'string') {
    const trimmed = value.replace(/^\{|\}$/g, '');
    if (!trimmed) return [];
    return trimmed
      .split(',')
      .map((part) => part.replace(/^"|"$/g, '').trim())
      .filter(Boolean);
  }
  return [];
}

function toDay(row: Row): DayRow {
  return {
    day_no: int(row.day_no),
    date: text(row.date),
    weekday: textOrNull(row.weekday),
    theme: text(row.theme),
    milestone: textOrNull(row.milestone),
  };
}

function toUser(row: Row): UserRow {
  return {
    email: text(row.email),
    name: text(row.name),
    track: asTrack(row.track),
    is_admin: flag(row.is_admin),
  };
}

function toTask(row: Row): TaskRow {
  return {
    id: int(row.id),
    code: text(row.code),
    day_no: int(row.day_no),
    track: asTrack(row.track),
    origin_track: asTrackOrNull(row.origin_track),
    title: text(row.title),
    detail: textOrNull(row.detail),
    output: textOrNull(row.output),
    status: asStatus(row.status),
    assignee: textOrNull(row.assignee),
    assignee_name: textOrNull(row.assignee_name),
    is_blocker: flag(row.is_blocker),
    sort_order: int(row.sort_order),
    created_by: textOrNull(row.created_by),
    completed_at: textOrNull(row.completed_at),
    completed_by: textOrNull(row.completed_by),
    labels: asStringArray(row.labels),
    comment_count: int(row.comment_count),
  };
}

function toComment(row: Row): CommentRow {
  return {
    id: int(row.id),
    task_id: int(row.task_id),
    author: text(row.author),
    author_name: text(row.author_name),
    body: text(row.body),
    created_at: text(row.created_at),
    mentions: asStringArray(row.mentions),
  };
}

function toActivity(row: Row): ActivityRow {
  return {
    id: int(row.id),
    actor: text(row.actor),
    actor_name: textOrNull(row.actor_name),
    action: text(row.action),
    task_id: row.task_id == null ? null : int(row.task_id),
    task_code: textOrNull(row.task_code),
    from_value: textOrNull(row.from_value),
    to_value: textOrNull(row.to_value),
    note: textOrNull(row.note),
    created_at: text(row.created_at),
  };
}

export async function getDays(): Promise<DayRow[]> {
  const sql = db();
  const rows = (await sql`
    SELECT day_no, to_char(date, 'YYYY-MM-DD') AS date, weekday, theme, milestone
    FROM sprint_days
    ORDER BY day_no
  `) as Row[];
  return rows.map(toDay);
}

export async function getUsers(): Promise<UserRow[]> {
  const sql = db();
  const rows = (await sql`
    SELECT email, name, track, is_admin
    FROM users
    ORDER BY is_admin DESC, name ASC
  `) as Row[];
  return rows.map(toUser);
}

export async function getTasks(): Promise<TaskRow[]> {
  const sql = db();
  const rows = (await sql`
    SELECT
      t.id,
      t.code,
      t.day_no,
      t.track,
      t.origin_track,
      t.title,
      t.detail,
      t.output,
      t.status,
      t.assignee,
      u.name AS assignee_name,
      t.is_blocker,
      t.sort_order,
      t.created_by,
      to_char(t.completed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS completed_at,
      t.completed_by,
      COALESCE(
        (SELECT array_agg(l.label ORDER BY l.label) FROM task_labels l WHERE l.task_id = t.id),
        ARRAY[]::text[]
      ) AS labels,
      (SELECT count(*) FROM comments c WHERE c.task_id = t.id) AS comment_count
    FROM tasks t
    LEFT JOIN users u ON u.email = t.assignee
    ORDER BY t.day_no ASC, t.sort_order ASC, t.id ASC
  `) as Row[];
  return rows.map(toTask);
}

export async function getBoard(me: SessionUser): Promise<BoardPayload> {
  const [days, tasks, users] = await Promise.all([getDays(), getTasks(), getUsers()]);
  return {
    me: { email: me.email, name: me.name, track: me.track, isAdmin: me.isAdmin },
    days,
    tasks,
    users,
  };
}

export async function getTaskByCode(code: string): Promise<TaskRow | null> {
  const sql = db();
  const rows = (await sql`
    SELECT
      t.id,
      t.code,
      t.day_no,
      t.track,
      t.origin_track,
      t.title,
      t.detail,
      t.output,
      t.status,
      t.assignee,
      u.name AS assignee_name,
      t.is_blocker,
      t.sort_order,
      t.created_by,
      to_char(t.completed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS completed_at,
      t.completed_by,
      COALESCE(
        (SELECT array_agg(l.label ORDER BY l.label) FROM task_labels l WHERE l.task_id = t.id),
        ARRAY[]::text[]
      ) AS labels,
      (SELECT count(*) FROM comments c WHERE c.task_id = t.id) AS comment_count
    FROM tasks t
    LEFT JOIN users u ON u.email = t.assignee
    WHERE upper(t.code) = upper(${code})
    LIMIT 1
  `) as Row[];
  const first = rows[0];
  return first ? toTask(first) : null;
}

export async function getComments(taskId: number): Promise<CommentRow[]> {
  const sql = db();
  const rows = (await sql`
    SELECT
      c.id,
      c.task_id,
      c.author,
      COALESCE(u.name, c.author) AS author_name,
      c.body,
      to_char(c.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
      COALESCE(
        (SELECT array_agg(m.mentioned) FROM mentions m WHERE m.comment_id = c.id),
        ARRAY[]::text[]
      ) AS mentions
    FROM comments c
    LEFT JOIN users u ON u.email = c.author
    WHERE c.task_id = ${taskId}
    ORDER BY c.created_at ASC, c.id ASC
  `) as Row[];
  return rows.map(toComment);
}

export async function getActivity(limit = 200): Promise<ActivityRow[]> {
  const sql = db();
  const rows = (await sql`
    SELECT
      a.id,
      a.actor,
      u.name AS actor_name,
      a.action,
      a.task_id,
      a.task_code,
      a.from_value,
      a.to_value,
      a.note,
      to_char(a.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
    FROM activity_log a
    LEFT JOIN users u ON u.email = a.actor
    ORDER BY a.created_at DESC, a.id DESC
    LIMIT ${limit}
  `) as Row[];
  return rows.map(toActivity);
}

export async function getTaskActivity(taskCode: string): Promise<ActivityRow[]> {
  const sql = db();
  const rows = (await sql`
    SELECT
      a.id,
      a.actor,
      u.name AS actor_name,
      a.action,
      a.task_id,
      a.task_code,
      a.from_value,
      a.to_value,
      a.note,
      to_char(a.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
    FROM activity_log a
    LEFT JOIN users u ON u.email = a.actor
    WHERE upper(a.task_code) = upper(${taskCode})
    ORDER BY a.created_at DESC, a.id DESC
    LIMIT 100
  `) as Row[];
  return rows.map(toActivity);
}

/**
 * Şema/bağlantı hatasını ekranda gösterilebilir bir mesaja çevirir. Sözlüğü
 * parametre olarak alır: bu dosya sunucu tarafı veri katmanı, çerez okumak
 * onun işi değil — dili çağıran sayfa zaten biliyor.
 */
export function readableDbError(error: unknown, t: Dictionary): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('DATABASE_URL')) return t.pages.dbError.noConnection;
  if (/relation .* does not exist/i.test(message)) return t.pages.dbError.noTables;
  return t.pages.dbError.unreadable(message);
}
