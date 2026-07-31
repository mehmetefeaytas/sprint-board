import { db } from '@/lib/db';
import { logActivity } from '@/lib/audit';
import { TRACK_ABBR } from '@/lib/config';
import { normalizeLabel } from '@/lib/labels';
import type { Track } from '@/lib/types';
import { auth, failT, fetchTask, isTrack, normalizeEmail, optionalText, readJson } from '../_util';

type CreateBody = {
  day_no?: unknown;
  track?: unknown;
  title?: unknown;
  detail?: unknown;
  output?: unknown;
  assignee?: unknown;
  labels?: unknown;
};

/** G{gün}-{track}-{sıra}; aynı prefix'teki en büyük sayısal sırayı bulup bir arttırır. */
async function nextCode(dayNo: number, track: Track): Promise<string> {
  const sql = db();
  const prefix = `G${dayNo}-${TRACK_ABBR[track]}-`;
  const rows = (await sql`
    SELECT code FROM tasks WHERE code LIKE ${`${prefix}%`}
  `) as unknown as { code: string }[];

  let max = 0;
  for (const row of rows) {
    // G3-AI-D01 gibi devralma kodları sayısal değil; atlanır.
    const match = /^(\d+)$/.exec(row.code.slice(prefix.length));
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `${prefix}${String(max + 1).padStart(2, '0')}`;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === '23505'
  );
}

function parseLabels(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const cleaned = value
    .filter((item): item is string => typeof item === 'string')
    .map(normalizeLabel)
    .filter((item) => item !== '');
  return Array.from(new Set(cleaned));
}

/** Görev oluşturmak yönetici yetkisi gerektirmez — bilinçli karar. */
export async function POST(request: Request): Promise<Response> {
  const guard = await auth();
  if ('response' in guard) return guard.response;

  const body = await readJson<CreateBody>(request);
  if (!body) return failT((m) => m.request.invalidBody, 400);

  const title = optionalText(body.title);
  if (!title) return failT((m) => m.task.titleRequired, 400);

  const dayNo = Number(body.day_no);
  if (!Number.isInteger(dayNo)) return failT((m) => m.request.invalidDayNo, 400);

  if (!isTrack(body.track)) return failT((m) => m.request.invalidTrack, 400);
  const track = body.track;

  const detail = optionalText(body.detail) ?? null;
  const output = optionalText(body.output) ?? null;
  const assignee =
    body.assignee === undefined || body.assignee === null
      ? null
      : normalizeEmail(body.assignee) || null;
  const labels = parseLabels(body.labels);

  try {
    const sql = db();

    const dayRows = (await sql`
      SELECT day_no FROM sprint_days WHERE day_no = ${dayNo}
    `) as unknown as { day_no: number }[];
    if (dayRows.length === 0) return failT((m) => m.task.dayNotFound, 400);

    if (assignee) {
      const userRows = (await sql`
        SELECT email FROM users WHERE email = ${assignee}
      `) as unknown as { email: string }[];
      if (userRows.length === 0) return failT((m) => m.task.assigneeNotOnTeam, 400);
    }

    let created: { id: number; code: string } | null = null;
    // Yarış durumunda UNIQUE ihlali olabilir; kod yeniden üretilip bir kez daha denenir.
    for (let attempt = 0; attempt < 2 && created === null; attempt += 1) {
      const code = await nextCode(dayNo, track);
      try {
        const rows = (await sql`
          INSERT INTO tasks (code, day_no, track, title, detail, output, assignee, created_by, sort_order)
          VALUES (
            ${code}, ${dayNo}, ${track}, ${title}, ${detail}, ${output}, ${assignee},
            ${guard.user.email},
            (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM tasks WHERE day_no = ${dayNo})
          )
          RETURNING id, code
        `) as unknown as { id: number; code: string }[];
        created = rows[0] ?? null;
      } catch (error) {
        if (attempt === 1 || !isUniqueViolation(error)) throw error;
      }
    }

    if (!created) return failT((m) => m.task.createFailed, 500);

    for (const label of labels) {
      await sql`
        INSERT INTO task_labels (task_id, label)
        VALUES (${created.id}, ${label})
        ON CONFLICT DO NOTHING
      `;
    }

    await logActivity({
      actor: guard.user.email,
      action: 'create',
      taskId: created.id,
      taskCode: created.code,
      note: title,
    });

    const task = await fetchTask(created.id);
    if (!task) return failT((m) => m.task.createdButUnreadable, 500);
    return Response.json(task, { status: 201 });
  } catch {
    return failT((m) => m.task.createFailed, 500);
  }
}
