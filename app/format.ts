// Tarih ve metin biçimlendirme. Hem sunucu hem istemci bileşenlerinden
// çağrılır; DB'ye dokunmaz.
//
// Ay ve gün adları Intl'e bırakılmadan elle yazılıyor. Sebebi hydration:
// Node ile tarayıcının ICU verisi kısa biçimlerde ayrışabiliyor, sunucu ile
// istemci farklı metin üretince React uyuşmazlık hatası veriyor. Saat dilimi de
// aynı gerekçeyle yapılandırmadan gelen sabit bir değer.

import { TIME_ZONE } from '@/lib/config';
import type { Locale } from '@/lib/i18n';

export { TIME_ZONE };

const MONTHS_SHORT: Record<Locale, string[]> = {
  tr: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

const MONTHS_LONG: Record<Locale, string[]> = {
  tr: [
    'Ocak',
    'Şubat',
    'Mart',
    'Nisan',
    'Mayıs',
    'Haziran',
    'Temmuz',
    'Ağustos',
    'Eylül',
    'Ekim',
    'Kasım',
    'Aralık',
  ],
  en: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
};

// Pazar'dan başlar — Date.getUTCDay() ile aynı sıra.
const WEEKDAYS_LONG: Record<Locale, string[]> = {
  tr: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};

const WEEKDAYS_SHORT: Record<Locale, string[]> = {
  tr: ['Paz', 'Pzt', 'Salı', 'Çrş', 'Prş', 'Cuma', 'Cmt'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

/** Yapılandırmada elle yazılmış gün adlarını kısaltabilmek için ters dizin. */
const SHORT_BY_LONG = new Map<string, string>();
for (const locale of ['tr', 'en'] as Locale[]) {
  WEEKDAYS_LONG[locale].forEach((long, index) => {
    SHORT_BY_LONG.set(long.toLocaleLowerCase(locale), WEEKDAYS_SHORT[locale][index]);
  });
}

function monthIndex(iso: string): number {
  return Number(iso.split('-')[1]) - 1;
}

/** '2026-07-31' → 5 (Cuma). UTC üzerinden; saat dilimi kaydırması yapmaz. */
function weekdayIndex(iso: string): number {
  const date = new Date(iso + 'T00:00:00Z');
  return Number.isNaN(date.getTime()) ? -1 : date.getUTCDay();
}

/**
 * Günün adı. Yapılandırmada `weekday` yazılmışsa ona saygı gösterilir — ekip
 * kendi terimini kullanmak isteyebilir. Yoksa tarihten ve aktif dilden
 * türetilir, yani iki dilli kullanımda alanı boş bırakmak daha iyidir.
 */
export function weekdayLabel(
  iso: string,
  weekday: string | null | undefined,
  locale: Locale,
): string {
  if (weekday && weekday.trim() !== '') return weekday;
  const index = weekdayIndex(iso);
  return index >= 0 ? WEEKDAYS_LONG[locale][index] : '';
}

/** weekdayLabel'in kısa hali: 'Perşembe' → 'Prş', 'Cuma' → 'Cuma'. */
export function shortWeekday(
  iso: string,
  weekday: string | null | undefined,
  locale: Locale,
): string {
  if (weekday && weekday.trim() !== '') {
    const trimmed = weekday.trim();
    return SHORT_BY_LONG.get(trimmed.toLocaleLowerCase(locale)) ?? trimmed;
  }
  const index = weekdayIndex(iso);
  return index >= 0 ? WEEKDAYS_SHORT[locale][index] : '';
}

/** '2026-07-31' → '31 Tem' (tr) · 'Jul 31' (en) */
export function shortDate(iso: string, locale: Locale): string {
  const day = String(Number(iso.split('-')[2]));
  const month = MONTHS_SHORT[locale][monthIndex(iso)];
  if (!month) return iso;
  return locale === 'en' ? `${month} ${day}` : `${day} ${month}`;
}

/** '2026-07-31' → '31 Temmuz 2026' (tr) · 'July 31, 2026' (en) */
export function longDate(iso: string, locale: Locale): string {
  const [year, , rawDay] = iso.split('-');
  const day = String(Number(rawDay));
  const month = MONTHS_LONG[locale][monthIndex(iso)];
  if (!month) return iso;
  return locale === 'en' ? `${month} ${day}, ${year}` : `${day} ${month} ${year}`;
}

/** Yapılandırılan saat dilimine göre anın YYYY-MM-DD karşılığı (en-CA bu biçimi verir). */
export function dayKey(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** Saat her iki dilde de 24 saatlik: '14:05'. */
function timeOfDay(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

/** Bugünse '14:05', değilse '31 Tem 14:05'. */
export function activityTime(isoTimestamp: string, todayISO: string, locale: Locale): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return isoTimestamp;
  const key = dayKey(date);
  const clock = timeOfDay(date);
  if (key === todayISO) return clock;
  return shortDate(key, locale) + ' ' + clock;
}

/** Tam zaman: '31 Tem 2026 14:05' */
export function fullTime(isoTimestamp: string, locale: Locale): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return isoTimestamp;
  const key = dayKey(date);
  const year = key.split('-')[0];
  return shortDate(key, locale) + ' ' + year + ' ' + timeOfDay(date);
}

/** fromISO (hariç) ile toISO (dahil) arasındaki hafta içi gün sayısı. */
export function businessDaysUntil(fromISO: string, toISO: string): number {
  const start = new Date(fromISO + 'T00:00:00Z');
  const end = new Date(toISO + 'T00:00:00Z');
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  let count = 0;
  const cursor = new Date(start.getTime());
  while (cursor.getTime() < end.getTime()) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    const weekday = cursor.getUTCDay();
    if (weekday !== 0 && weekday !== 6) count += 1;
  }
  return count;
}

export function percent(done: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Yorum gövdesini @etiket parçalarına ayırır. Bilinen isimler (çok kelimeli
 * olabilir) önce denenir, kalanlar için tek kelimelik @ad kalıbı kullanılır.
 */
export function splitMentions(
  body: string,
  names: string[],
): Array<{ text: string; mention: boolean }> {
  // Kullanıcı tam adı yazmak zorunda değil: "Ada Lovelace Byron" için
  // "Ada Lovelace" ve "Ada" da geçerli sayılır. Backend de aynı şekilde
  // çözümlüyor; ikisi ayrışmasın diye varyantlar burada üretilir.
  const variants = new Set<string>();
  for (const name of names.filter(Boolean)) {
    const parts = name.trim().split(/\s+/);
    for (let take = parts.length; take >= 1; take--) {
      variants.add(parts.slice(0, take).join(' '));
    }
  }
  const known = [...variants].sort((a, b) => b.length - a.length).map(escapeRegExp);
  const alternatives = known.length ? known.join('|') + '|' : '';
  // Lookbehind: "ada@ornek.com" gibi e-postalardaki @ mention sayılmaz.
  const regex = new RegExp('(?<![\\p{L}\\p{N}._-])@(?:' + alternatives + '[\\p{L}]+)', 'gu');
  const out: Array<{ text: string; mention: boolean }> = [];
  let last = 0;
  for (const match of body.matchAll(regex)) {
    const index = match.index ?? 0;
    if (index > last) out.push({ text: body.slice(last, index), mention: false });
    out.push({ text: match[0], mention: true });
    last = index + match[0].length;
  }
  if (last < body.length) out.push({ text: body.slice(last), mention: false });
  return out;
}
