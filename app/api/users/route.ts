import { db } from '@/lib/db';
import { logActivity } from '@/lib/audit';
import { PROTECTED_EMAILS } from '@/lib/config';
import type { UserRow } from '@/lib/types';
import { auth, authAdmin, failT, isTrack, normalizeEmail, optionalText, readJson } from '../_util';

type CreateBody = { email?: unknown; name?: unknown; track?: unknown; is_admin?: unknown };

export async function GET(): Promise<Response> {
  const guard = await auth();
  if ('response' in guard) return guard.response;

  try {
    const sql = db();
    const rows = (await sql`
      SELECT email, name, track, is_admin FROM users ORDER BY name ASC
    `) as unknown as UserRow[];
    return Response.json(rows);
  } catch {
    return failT((m) => m.user.listReadFailed, 500);
  }
}

export async function POST(request: Request): Promise<Response> {
  const guard = await authAdmin();
  if ('response' in guard) return guard.response;

  const body = await readJson<CreateBody>(request);
  if (!body) return failT((m) => m.request.invalidBody, 400);

  const email = normalizeEmail(body.email);
  if (!email.includes('@')) return failT((m) => m.auth.emailInvalid, 400);

  const name = optionalText(body.name);
  if (!name) return failT((m) => m.user.nameRequired, 400);

  if (!isTrack(body.track)) return failT((m) => m.request.invalidTrack, 400);
  const isAdmin = body.is_admin === true;

  try {
    const sql = db();
    const rows = (await sql`
      INSERT INTO users (email, name, track, is_admin)
      VALUES (${email}, ${name}, ${body.track}, ${isAdmin})
      ON CONFLICT (email) DO NOTHING
      RETURNING email, name, track, is_admin
    `) as unknown as UserRow[];

    const created = rows[0];
    if (!created) return failT((m) => m.user.emailTaken, 409);

    await logActivity({ actor: guard.user.email, action: 'user_add', to: created.email });
    return Response.json(created, { status: 201 });
  } catch {
    return failT((m) => m.user.addFailed, 500);
  }
}

export async function DELETE(request: Request): Promise<Response> {
  const guard = await authAdmin();
  if ('response' in guard) return guard.response;

  const email = normalizeEmail(new URL(request.url).searchParams.get('email'));
  if (!email) return failT((m) => m.auth.emailRequired, 400);
  if (PROTECTED_EMAILS.includes(email)) {
    return failT((m) => m.user.protectedAdmin, 400);
  }

  try {
    const sql = db();
    const rows = (await sql`
      DELETE FROM users WHERE email = ${email} RETURNING email
    `) as unknown as { email: string }[];
    if (!rows[0]) return failT((m) => m.user.notFound, 404);

    await logActivity({ actor: guard.user.email, action: 'user_remove', from: email });
    return Response.json({ ok: true });
  } catch {
    return failT((m) => m.user.removeFailed, 500);
  }
}
