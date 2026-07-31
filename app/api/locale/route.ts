import { LOCALE_COOKIE, isLocale } from '@/lib/i18n';
import { failT, readJson } from '../_util';

type LocaleBody = { locale?: unknown };

/**
 * Arayüz dilini değiştirir. Oturum gerektirir mi? Hayır — giriş ekranında da
 * dil değiştirilebilmeli. Yaptığı tek şey bir tercih çerezi yazmak; yetkiyle
 * ilgili hiçbir sonucu yok, o yüzden proxy.ts bunu açık uçlar arasında tutar.
 */
export async function POST(request: Request): Promise<Response> {
  const body = await readJson<LocaleBody>(request);
  if (!isLocale(body?.locale)) return failT((m) => m.request.invalidLocale, 400);

  const response = Response.json({ ok: true, locale: body.locale });
  response.headers.append(
    'Set-Cookie',
    [
      `${LOCALE_COOKIE}=${body.locale}`,
      'Path=/',
      'SameSite=Lax',
      `Max-Age=${60 * 60 * 24 * 365}`,
      process.env.NODE_ENV === 'production' ? 'Secure' : '',
    ]
      .filter(Boolean)
      .join('; '),
  );
  return response;
}
