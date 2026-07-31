// Sözlüğü diller arasında birleştiren yer. Hem sunucu hem istemci
// bileşenlerinden import edilebilir; `next/headers` gibi sunucuya özgü hiçbir
// şeye dokunmaz. Çerezi okuyup dili bulmak için lib/i18n/server.ts'e bak.

import { common } from './sections/common';
import { nav } from './sections/nav';
import { pages } from './sections/pages';
import { board } from './sections/board';
import { task } from './sections/task';
import { team } from './sections/team';
import { activity } from './sections/activity';
import { auth } from './sections/auth';
import { api } from './sections/api';
import type { Locale } from './locales';

export { LOCALES, LOCALE_NAMES, LOCALE_COOKIE, FALLBACK_LOCALE, isLocale } from './locales';
export type { Locale } from './locales';

/**
 * Verilen dilin tüm metinleri. İki dilin anahtarları TypeScript tarafından
 * eşitlenir: bir bölüme yalnızca bir dilde anahtar eklemek derleme hatasıdır.
 */
export function dict(locale: Locale) {
  return {
    common: common[locale],
    nav: nav[locale],
    pages: pages[locale],
    board: board[locale],
    task: task[locale],
    team: team[locale],
    activity: activity[locale],
    auth: auth[locale],
    api: api[locale],
  };
}

export type Dictionary = ReturnType<typeof dict>;
