// Türkçe biçimlendirme yardımcıları. Hem sunucu hem istemci bileşenlerinden
// çağrılır; DB'ye dokunmaz. Tarihler sabit saat diliminde biçimlenir ki
// sunucu ve istemci çıktısı aynı olsun (hydration uyumsuzluğu olmasın).

import { TIME_ZONE } from '@/lib/config';

export { TIME_ZONE };

const MONTHS_SHORT = [
  'Oca',
  'Şub',
  'Mar',
  'Nis',
  'May',
  'Haz',
  'Tem',
  'Ağu',
  'Eyl',
  'Eki',
  'Kas',
  'Ara',
];

const MONTHS_LONG = [
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
];

const WEEKDAY_SHORT: Record<string, string> = {
  Pazartesi: 'Pzt',
  Salı: 'Salı',
  Çarşamba: 'Çrş',
  Perşembe: 'Prş',
  Cuma: 'Cuma',
  Cumartesi: 'Cmt',
  Pazar: 'Paz',
};

export function shortWeekday(weekday: string): string {
  return WEEKDAY_SHORT[weekday] ?? weekday;
}

/** '2026-07-31' → '31 Tem' */
export function shortDate(iso: string): string {
  const [, month, day] = iso.split('-');
  const name = MONTHS_SHORT[Number(month) - 1] ?? month;
  return String(Number(day)) + ' ' + name;
}

/** '2026-07-31' → '31 Temmuz 2026' */
export function longDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  const name = MONTHS_LONG[Number(month) - 1] ?? month;
  return String(Number(day)) + ' ' + name + ' ' + year;
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

function timeOfDay(date: Date): string {
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/** Bugünse '14:05', değilse '31 Tem 14:05'. */
export function activityTime(isoTimestamp: string, todayISO: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return isoTimestamp;
  const key = dayKey(date);
  const clock = timeOfDay(date);
  if (key === todayISO) return clock;
  return shortDate(key) + ' ' + clock;
}

/** Tam zaman: '31 Tem 2026 14:05' */
export function fullTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return isoTimestamp;
  const key = dayKey(date);
  const year = key.split('-')[0];
  return shortDate(key) + ' ' + year + ' ' + timeOfDay(date);
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
  const known = [...variants]
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp);
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
