import { db } from '@/lib/db';
import type { BoardPayload, DayRow, UserRow } from '@/lib/types';
import { auth, failT, fetchTasks } from '../_util';

async function fetchDays(): Promise<DayRow[]> {
  const sql = db();
  // DATE tipini JS Date'e çevirip gün kaydırmamak için metin olarak alıyoruz.
  const rows = await sql`
    SELECT day_no,
           to_char(date, 'YYYY-MM-DD') AS date,
           weekday,
           theme,
           milestone
    FROM sprint_days
    ORDER BY day_no ASC
  `;
  return rows as unknown as DayRow[];
}

async function fetchUsers(): Promise<UserRow[]> {
  const sql = db();
  const rows = await sql`SELECT email, name, track, is_admin FROM users ORDER BY name ASC`;
  return rows as unknown as UserRow[];
}

export async function GET(): Promise<Response> {
  const guard = await auth();
  if ('response' in guard) return guard.response;

  try {
    const [days, users, tasks] = await Promise.all([fetchDays(), fetchUsers(), fetchTasks()]);

    // track/is_admin token'da eskimiş olabilir; veritabanındaki satır esas.
    const meRow = users.find((u) => u.email === guard.user.email);
    if (!meRow) return failT((m) => m.auth.userNotOnTeam, 401);

    const payload: BoardPayload = {
      me: { email: meRow.email, name: meRow.name, track: meRow.track, isAdmin: meRow.is_admin },
      days,
      tasks,
      users,
    };
    return Response.json(payload);
  } catch {
    return failT((m) => m.board.readFailed, 500);
  }
}
