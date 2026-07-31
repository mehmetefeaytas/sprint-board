import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySession } from './lib/session';

// Next.js 16: dosya adı `middleware` değil `proxy`, fonksiyon adı da `proxy`.
// Runtime nodejs olduğu için jose burada çalışır. DB'ye dokunulmaz.

const PUBLIC_PATHS = ['/giris'];
const PUBLIC_APIS = ['/api/auth/login', '/api/seed'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_APIS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  const isPublicPage = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Girişli kullanıcı /giris'e gelirse board'a yolla.
  if (session && isPublicPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (session || isPublicPage) {
    return NextResponse.next();
  }

  // Oturumsuz API çağrısı: yönlendirme yerine 401 JSON.
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 });
  }

  return NextResponse.redirect(new URL('/giris', request.url));
}

export const config = {
  // Statik dosyaları ve görsel optimizasyonunu dışarıda bırak.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
