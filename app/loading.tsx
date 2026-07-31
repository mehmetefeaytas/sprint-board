import { getDict } from '@/lib/i18n/server';

export default async function Loading() {
  const { t } = await getDict();

  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <p className="text-sm text-slate-500 dark:text-slate-400">{t.common.state.loading}</p>
      <div className="h-28 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
      <div className="h-11 w-48 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
      <div className="grid gap-3 md:grid-cols-2">
        <div className="h-24 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="h-24 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="h-24 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="h-24 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}
