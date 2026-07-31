'use client';

// İstemci bileşenleri dili buradan okur. Yalnızca dil adı (kısa bir metin)
// sunucudan istemciye geçer; sözlüğün kendisi iki tarafta da import edilir —
// içinde fonksiyonlar olduğu için props ile taşınamaz (serialize edilemez).

import { createContext, useContext, useMemo } from 'react';
import { dict, type Dictionary } from './index';
import { FALLBACK_LOCALE, type Locale } from './locales';

const LocaleContext = createContext<Locale>(FALLBACK_LOCALE);

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** Aktif dilin sözlüğü. Sunucu tarafındaki getDict()'in istemci karşılığı. */
export function useDict(): Dictionary {
  const locale = useLocale();
  return useMemo(() => dict(locale), [locale]);
}
