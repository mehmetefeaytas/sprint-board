// Sunucu tarafında aktif dili bulur. Yalnızca sunucu bileşenlerinden ve route
// handler'lardan çağrılabilir (`next/headers` istemcide çalışmaz).

import { cookies } from 'next/headers';
import { SPRINT } from '@/lib/config';
import { dict, type Dictionary } from './index';
import { FALLBACK_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from './locales';

/**
 * Dil sırası: kullanıcının seçtiği çerez → sprint.config.ts defaultLocale →
 * FALLBACK_LOCALE. Tarayıcının Accept-Language başlığına bakılmaz; ekip aynı
 * panoyu paylaşıyor ve seçim kalıcı olsun diye tercih açıkça saklanır.
 */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const chosen = store.get(LOCALE_COOKIE)?.value;
  if (isLocale(chosen)) return chosen;
  return isLocale(SPRINT.defaultLocale) ? SPRINT.defaultLocale : FALLBACK_LOCALE;
}

/** getLocale + dict tek adımda — sunucu bileşenlerinin çoğu bunu ister. */
export async function getDict(): Promise<{ locale: Locale; t: Dictionary }> {
  const locale = await getLocale();
  return { locale, t: dict(locale) };
}
