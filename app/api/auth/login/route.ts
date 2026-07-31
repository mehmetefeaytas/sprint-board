import { createHash, timingSafeEqual } from 'node:crypto';
import { db } from '@/lib/db';
import { logActivity } from '@/lib/audit';
import { setSessionCookie, signSession, type SessionUser } from '@/lib/session';
import type { UserRow } from '@/lib/types';
import { fail, normalizeEmail, readJson } from '../../_util';

type LoginBody = { email?: unknown; password?: unknown };

/**
 * Uzunluk farkı da zamanlama bilgisi sızdırdığı için önce sabit uzunluklu
 * özet alınır, karşılaştırma o özetler üzerinde yapılır.
 */
function constantTimeEqual(a: string, b: string): boolean {
  const left = createHash('sha256').update(a, 'utf8').digest();
  const right = createHash('sha256').update(b, 'utf8').digest();
  return timingSafeEqual(left, right);
}

async function findUser(email: string): Promise<UserRow | null> {
  const sql = db();
  const rows = (await sql`
    SELECT email, name, track, is_admin FROM users WHERE email = ${email}
  `) as unknown as UserRow[];
  return rows[0] ?? null;
}

/** Giriş ekranı şifre alanını buna göre açar. Var olmayan e-posta da hata değil. */
export async function GET(request: Request): Promise<Response> {
  const email = normalizeEmail(new URL(request.url).searchParams.get('email'));
  if (!email) return Response.json({ exists: false, isAdmin: false });

  try {
    const user = await findUser(email);
    return Response.json({ exists: user !== null, isAdmin: user?.is_admin === true });
  } catch {
    return fail('Kullanıcı bilgisi okunamadı.', 500);
  }
}

export async function POST(request: Request): Promise<Response> {
  const body = await readJson<LoginBody>(request);
  const email = normalizeEmail(body?.email);
  if (!email) return fail('E-posta gerekli.', 400);

  try {
    const user = await findUser(email);
    if (!user) return fail('Bu e-posta ekip listesinde yok.', 403);

    if (user.is_admin) {
      const expected = process.env.ADMIN_PASSWORD;
      if (!expected) return fail('Yönetici şifresi sunucuda tanımlı değil.', 500);
      const given = typeof body?.password === 'string' ? body.password : '';
      if (given === '' || !constantTimeEqual(given, expected)) {
        return fail('Şifre hatalı.', 401);
      }
    }

    const session: SessionUser = {
      email: user.email,
      name: user.name,
      track: user.track,
      isAdmin: user.is_admin,
    };
    await setSessionCookie(await signSession(session));
    await logActivity({ actor: session.email, action: 'login' });

    return Response.json({ ok: true, user: session });
  } catch {
    return fail('Giriş yapılamadı.', 500);
  }
}
