import { db } from '@/lib/db';
import { SPRINT_DAYS, TASKS, USERS } from '@/lib/config';
import { schemaStatements } from '@/lib/schema';
import { failT } from '../_util';

type Row = (string | number | boolean | null)[];

/** Çok satırlı INSERT için "($1, $2), ($3, $4)" üretir; değerler parametre kalır. */
function valuesClause(rows: Row[]): { text: string; values: Row } {
  const values: Row = [];
  const tuples = rows.map((row) => {
    const placeholders = row.map((value) => {
      values.push(value);
      return `$${values.length}`;
    });
    return `(${placeholders.join(', ')})`;
  });
  return { text: tuples.join(', '), values };
}

/**
 * Şemayı kurar ve sprint.config.ts'i veritabanına yazar.
 *
 * ON CONFLICT DO NOTHING: tekrar çağırmak güvenlidir ama var olan kayıtları
 * GÜNCELLEMEZ. Yapılandırmayı tohumladıktan sonra değiştirirsen yalnızca yeni
 * satırlar eklenir; mevcut görevlerin başlığı, durumu ve ataması olduğu gibi
 * kalır. Bu bilinçli: pano üzerinde yapılan gerçek işi bir yeniden tohumlama
 * silip başa almasın.
 */
export async function POST(request: Request): Promise<Response> {
  const expected = process.env.SEED_TOKEN;
  const given = request.headers.get('x-seed-token');
  if (!expected || given !== expected) {
    return failT((m) => m.seed.badToken, 403);
  }

  try {
    const sql = db();

    for (const statement of schemaStatements()) {
      await sql.query(statement);
    }

    const userInsert = valuesClause(
      USERS.map((user) => [user.email, user.name, user.track, user.is_admin]),
    );
    const insertedUsers = await sql.query<false, false>(
      `INSERT INTO users (email, name, track, is_admin)
       VALUES ${userInsert.text}
       ON CONFLICT (email) DO NOTHING
       RETURNING email`,
      userInsert.values,
    );

    const dayInsert = valuesClause(
      SPRINT_DAYS.map((day) => [day.day_no, day.date, day.weekday, day.theme, day.milestone]),
    );
    const insertedDays = await sql.query<false, false>(
      `INSERT INTO sprint_days (day_no, date, weekday, theme, milestone)
       VALUES ${dayInsert.text}
       ON CONFLICT (day_no) DO NOTHING
       RETURNING day_no`,
      dayInsert.values,
    );

    let insertedTasks: unknown[] = [];
    let insertedLabels = 0;

    if (TASKS.length > 0) {
      const now = new Date().toISOString();
      const taskInsert = valuesClause(
        TASKS.map((task, index) => [
          task.code,
          task.day_no,
          task.track,
          task.origin_track,
          task.title,
          task.detail,
          task.output,
          task.status,
          task.assignee,
          task.is_blocker,
          index,
          task.status === 'done' ? now : null,
          task.status === 'done' ? task.assignee : null,
        ]),
      );
      insertedTasks = await sql.query<false, false>(
        `INSERT INTO tasks (code, day_no, track, origin_track, title, detail, output,
                            status, assignee, is_blocker, sort_order, completed_at, completed_by)
         VALUES ${taskInsert.text}
         ON CONFLICT (code) DO NOTHING
         RETURNING code`,
        taskInsert.values,
      );

      // Etiketler için görev id'leri gerekir; kod zaten var olsa da id'yi okuyoruz.
      const labelled = TASKS.filter((task) => task.labels.length > 0);
      if (labelled.length > 0) {
        const codes = labelled.map((task) => task.code);
        const idRows = (await sql.query(
          `SELECT id, code FROM tasks WHERE code IN (${codes.map((_, i) => `$${i + 1}`).join(', ')})`,
          codes,
        )) as unknown as { id: number; code: string }[];
        const idByCode = new Map(idRows.map((row) => [row.code, row.id]));

        const labelRows: Row[] = [];
        for (const task of labelled) {
          const taskId = idByCode.get(task.code);
          if (taskId === undefined) continue;
          for (const label of task.labels) labelRows.push([taskId, label]);
        }

        if (labelRows.length > 0) {
          const labelInsert = valuesClause(labelRows);
          const result = await sql.query<false, false>(
            `INSERT INTO task_labels (task_id, label)
             VALUES ${labelInsert.text}
             ON CONFLICT DO NOTHING
             RETURNING task_id`,
            labelInsert.values,
          );
          insertedLabels = result.length;
        }
      }
    }

    return Response.json({
      ok: true,
      inserted: {
        users: insertedUsers.length,
        days: insertedDays.length,
        tasks: insertedTasks.length,
        labels: insertedLabels,
      },
    });
  } catch {
    return failT((m) => m.seed.failed, 500);
  }
}
