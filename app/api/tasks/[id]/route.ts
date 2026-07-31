import { db } from '@/lib/db';
import { logActivity, type AuditAction } from '@/lib/audit';
import type { Status, Track } from '@/lib/types';
import { auth, authAdmin, failT, fetchTask, isStatus, normalizeEmail, optionalText, parseId, readJson } from '../../_util';

type PatchBody = {
  status?: unknown;
  assignee?: unknown;
  title?: unknown;
  detail?: unknown;
  output?: unknown;
  day_no?: unknown;
};

type CurrentTask = {
  id: number;
  code: string;
  status: Status;
  assignee: string | null;
  origin_track: Track | null;
};

async function loadTask(id: number): Promise<CurrentTask | null> {
  const sql = db();
  const rows = (await sql`
    SELECT id, code, status, assignee, origin_track FROM tasks WHERE id = ${id}
  `) as unknown as CurrentTask[];
  return rows[0] ?? null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const guard = await auth();
  if ('response' in guard) return guard.response;

  const id = parseId((await params).id);
  if (id === null) return failT((m) => m.request.invalidTaskId, 400);

  const body = await readJson<PatchBody>(request);
  if (!body) return failT((m) => m.request.invalidBody, 400);

  try {
    const sql = db();
    const current = await loadTask(id);
    if (!current) return failT((m) => m.task.notFound, 404);

    // SET parçaları yalnızca buradaki sabit metinlerden oluşur; değerler $n ile gider.
    const sets: string[] = [];
    const values: unknown[] = [];
    const set = (column: string, value: unknown): void => {
      values.push(value);
      sets.push(`${column} = $${values.length}`);
    };

    if (body.title !== undefined) {
      const title = optionalText(body.title);
      if (!title) return failT((m) => m.task.titleRequired, 400);
      set('title', title);
    }

    if (body.detail !== undefined) {
      const detail = optionalText(body.detail);
      if (detail === undefined) return failT((m) => m.request.invalidDetail, 400);
      set('detail', detail);
    }

    if (body.output !== undefined) {
      const output = optionalText(body.output);
      if (output === undefined) return failT((m) => m.request.invalidOutput, 400);
      set('output', output);
    }

    if (body.day_no !== undefined) {
      const dayNo = Number(body.day_no);
      if (!Number.isInteger(dayNo)) return failT((m) => m.request.invalidDayNo, 400);
      const dayRows = (await sql`
        SELECT day_no FROM sprint_days WHERE day_no = ${dayNo}
      `) as unknown as { day_no: number }[];
      if (dayRows.length === 0) return failT((m) => m.task.dayNotFound, 400);
      set('day_no', dayNo);
    }

    let statusChange: { from: Status; to: Status } | null = null;
    if (body.status !== undefined) {
      if (!isStatus(body.status)) return failT((m) => m.request.invalidStatus, 400);
      if (body.status !== current.status) {
        statusChange = { from: current.status, to: body.status };
        set('status', body.status);
        if (body.status === 'done') {
          sets.push('completed_at = now()');
          set('completed_by', guard.user.email);
        } else if (current.status === 'done') {
          sets.push('completed_at = NULL', 'completed_by = NULL');
        }
      }
    }

    let assignChange: { from: string | null; to: string | null; action: AuditAction } | null = null;
    if (body.assignee !== undefined) {
      const next = body.assignee === null ? null : normalizeEmail(body.assignee) || null;
      if (next !== null) {
        const userRows = (await sql`
          SELECT email FROM users WHERE email = ${next}
        `) as unknown as { email: string }[];
        if (userRows.length === 0) return failT((m) => m.task.assigneeNotOnTeam, 400);
      }
      if (next !== current.assignee) {
        // Kendine atama + origin_track dolu ⇒ başka bir track'ten devralma.
        const action: AuditAction =
          next === guard.user.email && current.origin_track ? 'claim' : 'assign';
        assignChange = { from: current.assignee, to: next, action };
        set('assignee', next);
      }
    }

    sets.push('updated_at = now()');
    values.push(id);
    await sql.query(`UPDATE tasks SET ${sets.join(', ')} WHERE id = $${values.length}`, values);

    if (statusChange) {
      await logActivity({
        actor: guard.user.email,
        action: 'status',
        taskId: current.id,
        taskCode: current.code,
        from: statusChange.from,
        to: statusChange.to,
      });
    }
    if (assignChange) {
      await logActivity({
        actor: guard.user.email,
        action: assignChange.action,
        taskId: current.id,
        taskCode: current.code,
        from: assignChange.from,
        to: assignChange.to,
      });
    }

    const task = await fetchTask(id);
    if (!task) return failT((m) => m.task.notFound, 404);
    return Response.json(task);
  } catch {
    return failT((m) => m.task.updateFailed, 500);
  }
}

/** Silme yalnızca yönetici. Yorumlar ve etiketler CASCADE ile gider. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const guard = await authAdmin();
  if ('response' in guard) return guard.response;

  const id = parseId((await params).id);
  if (id === null) return failT((m) => m.request.invalidTaskId, 400);

  try {
    const sql = db();
    const rows = (await sql`
      DELETE FROM tasks WHERE id = ${id} RETURNING id, code
    `) as unknown as { id: number; code: string }[];
    const deleted = rows[0];
    if (!deleted) return failT((m) => m.task.notFound, 404);

    await logActivity({
      actor: guard.user.email,
      action: 'delete',
      taskId: deleted.id,
      taskCode: deleted.code,
    });

    return Response.json({ ok: true });
  } catch {
    return failT((m) => m.task.deleteFailed, 500);
  }
}
