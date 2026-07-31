import { db } from '@/lib/db';
import { logActivity } from '@/lib/audit';
import { PROTECTED_EMAILS } from '@/lib/config';
import type { UserRow } from '@/lib/types';
import {
  auth,
  authAdmin,
  fail,
  isTrack,
  normalizeEmail,
  optionalText,
  readJson,
} from '../_util';

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
    return fail('Ekip listesi okunamadı.', 500);
  }
}

export async function POST(request: Request): Promise<Response> {
  const guard = await authAdmin();
  if ('response' in guard) return guard.response;

  const body = await readJson<CreateBody>(request);
  if (!body) return fail('Geçersiz istek gövdesi.', 400);

  const email = normalizeEmail(body.email);
  if (!email.includes('@')) return fail('Geçerli bir e-posta girin.', 400);

  const name = optionalText(body.name);
  if (!name) return fail('İsim boş olamaz.', 400);

  if (!isTrack(body.track)) return fail('Geçersiz track.', 400);
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
    if (!created) return fail('Bu e-posta zaten kayıtlı.', 409);

    await logActivity({ actor: guard.user.email, action: 'user_add', to: created.email });
    return Response.json(created, { status: 201 });
  } catch {
    return fail('Kişi eklenemedi.', 500);
  }
}

export async function DELETE(request: Request): Promise<Response> {
  const guard = await authAdmin();
  if ('response' in guard) return guard.response;

  const email = normalizeEmail(new URL(request.url).searchParams.get('email'));
  if (!email) return fail('E-posta gerekli.', 400);
  if (PROTECTED_EMAILS.includes(email)) {
    return fail('Yapılandırmada tanımlı yönetici hesabı silinemez.', 400);
  }

  try {
    const sql = db();
    const rows = (await sql`
      DELETE FROM users WHERE email = ${email} RETURNING email
    `) as unknown as { email: string }[];
    if (!rows[0]) return fail('Kişi bulunamadı.', 404);

    await logActivity({ actor: guard.user.email, action: 'user_remove', from: email });
    return Response.json({ ok: true });
  } catch {
    return fail('Kişi çıkarılamadı.', 500);
  }
}
