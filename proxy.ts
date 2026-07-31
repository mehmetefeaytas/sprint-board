import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySession } from './lib/session';
import { SPRINT } from './lib/config';
import { dict, FALLBACK_LOCALE, LOCALE_COOKIE, isLocale } from './lib/i18n';

// Next.js 16: dosya adı `middleware` değil `proxy`, fonksiyon adı da `proxy`.
// Runtime nodejs olduğu için jose burada çalışır. DB'ye dokunulmaz.

const PUBLIC_PATHS = ['/giris'];
const PUBLIC_APIS = ['/api/auth/login', '/api/seed', '/api/locale'];

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
  //
  // Mesaj burada da çevrilir. Bu istek route handler'a hiç ulaşmadığı için
  // failT() devreye giremiyor; dili çerezten okuyup sözlüğü doğrudan
  // kullanıyoruz. `next/headers` yerine request.cookies — proxy'nin elinde
  // istek nesnesi zaten var.
  if (pathname.startsWith('/api/')) {
    const chosen = request.cookies.get(LOCALE_COOKIE)?.value;
    const locale = isLocale(chosen)
      ? chosen
      : isLocale(SPRINT.defaultLocale)
        ? SPRINT.defaultLocale
        : FALLBACK_LOCALE;
    return NextResponse.json({ error: dict(locale).api.session.missing }, { status: 401 });
  }

  return NextResponse.redirect(new URL('/giris', request.url));
}

export const config = {
  // Statik dosyaları ve görsel optimizasyonunu dışarıda bırak.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
