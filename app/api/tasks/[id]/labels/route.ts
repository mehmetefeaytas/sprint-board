import { db } from '@/lib/db';
import { logActivity } from '@/lib/audit';
import { normalizeLabel } from '@/lib/labels';
import { auth, fail, parseId, readJson } from '../../../_util';

type LabelBody = { label?: unknown };

async function resolve(
  request: Request,
  params: Promise<{ id: string }>,
): Promise<{ id: number; label: string } | Response> {
  const id = parseId((await params).id);
  if (id === null) return fail('Geçersiz görev numarası.', 400);

  const body = await readJson<LabelBody>(request);
  const label = typeof body?.label === 'string' ? normalizeLabel(body.label) : '';
  if (label === '') return fail('Etiket boş olamaz.', 400);

  return { id, label };
}

async function loadTask(id: number): Promise<{ id: number; code: string } | null> {
  const sql = db();
  const rows = (await sql`
    SELECT id, code FROM tasks WHERE id = ${id}
  `) as unknown as { id: number; code: string }[];
  return rows[0] ?? null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const guard = await auth();
  if ('response' in guard) return guard.response;

  const parsed = await resolve(request, params);
  if (parsed instanceof Response) return parsed;

  try {
    const sql = db();
    const task = await loadTask(parsed.id);
    if (!task) return fail('Görev bulunamadı.', 404);

    await sql`
      INSERT INTO task_labels (task_id, label)
      VALUES (${parsed.id}, ${parsed.label})
      ON CONFLICT DO NOTHING
    `;

    await logActivity({
      actor: guard.user.email,
      action: 'label',
      taskId: task.id,
      taskCode: task.code,
      to: parsed.label,
    });

    return Response.json({ ok: true, label: parsed.label });
  } catch {
    return fail('Etiket eklenemedi.', 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const guard = await auth();
  if ('response' in guard) return guard.response;

  const parsed = await resolve(request, params);
  if (parsed instanceof Response) return parsed;

  try {
    const sql = db();
    const task = await loadTask(parsed.id);
    if (!task) return fail('Görev bulunamadı.', 404);

    await sql`
      DELETE FROM task_labels WHERE task_id = ${parsed.id} AND label = ${parsed.label}
    `;

    await logActivity({
      actor: guard.user.email,
      action: 'label',
      taskId: task.id,
      taskCode: task.code,
      from: parsed.label,
    });

    return Response.json({ ok: true, label: parsed.label });
  } catch {
    return fail('Etiket kaldırılamadı.', 500);
  }
}
