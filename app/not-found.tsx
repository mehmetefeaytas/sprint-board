import Link from 'next/link';
import { getDict } from '@/lib/i18n/server';

export default async function NotFound() {
  const { t } = await getDict();

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
      <h1 className="text-lg font-semibold">{t.pages.notFoundHeading}</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.pages.notFoundBody}</p>
      <Link
        href="/"
        className="mt-4 inline-flex h-11 items-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900"
      >
        {t.pages.backToBoard}
      </Link>
    </div>
  );
}
