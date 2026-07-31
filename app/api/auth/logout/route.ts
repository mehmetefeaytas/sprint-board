import { logActivity } from '@/lib/audit';
import { clearSessionCookie, getSession } from '@/lib/session';

export async function POST(): Promise<Response> {
  const user = await getSession();

  if (user) {
    // Audit yazımı başarısız olsa da çıkışı engellemeyiz.
    try {
      await logActivity({ actor: user.email, action: 'logout' });
    } catch {
      /* yoksay */
    }
  }

  await clearSessionCookie();
  return Response.json({ ok: true });
}
