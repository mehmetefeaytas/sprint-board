// Desteklenen diller. Yeni bir dil eklemek için: buraya anahtarı ekle, sonra
// lib/i18n/sections/ altındaki her bölüm dosyasına o dilin karşılıklarını yaz.
// TypeScript eksik anahtarı derlemede yakalar.

export const LOCALES = ['tr', 'en'] as const;

export type Locale = (typeof LOCALES)[number];

/** Dil değiştirme düğmesinde görünen adlar — her zaman kendi dilinde. */
export const LOCALE_NAMES: Record<Locale, string> = {
  tr: 'Türkçe',
  en: 'English',
};

/** Arayüz dili bu çerezde saklanır; sunucu ve istemci aynı değeri okur. */
export const LOCALE_COOKIE = 'sb_locale';

/** sprint.config.ts defaultLocale vermezse kullanılır. */
export const FALLBACK_LOCALE: Locale = 'en';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}
