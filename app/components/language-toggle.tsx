'use client';

// Dil değiştirme düğmesi. İki dil olduğu için açılır menü değil, tek tık:
// düğme her zaman "diğer dile geç" anlamına gelir.

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LOCALES, LOCALE_NAMES } from '@/lib/i18n';
import { useDict, useLocale } from '@/lib/i18n/provider';

export default function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const locale = useLocale();
  const t = useDict();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);

  const next = LOCALES.find((item) => item !== locale) ?? locale;

  async function switchTo() {
    setSaving(true);
    try {
      await fetch('/api/locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: next }),
      });
      // Çerez sunucuda okunduğu için sayfanın yeniden çizilmesi gerekiyor.
      startTransition(() => router.refresh());
    } finally {
      setSaving(false);
    }
  }

  const busy = saving || pending;

  return (
    <button
      type="button"
      onClick={switchTo}
      disabled={busy}
      aria-label={t.nav.switchLanguage(LOCALE_NAMES[next])}
      title={t.nav.switchLanguage(LOCALE_NAMES[next])}
      className={`flex h-11 shrink-0 items-center rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 ${
        compact ? 'px-2' : 'px-3'
      }`}
    >
      <span aria-hidden="true">🌐</span>
      <span className="ml-1.5 uppercase">{next}</span>
    </button>
  );
}
