import type { ReactNode } from 'react';

const TONES = {
  error:
    'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200',
  info: 'border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300',
  warn: 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200',
} as const;

export function Notice({
  tone = 'info',
  title,
  children,
}: {
  tone?: keyof typeof TONES;
  title?: string;
  children?: ReactNode;
}) {
  return (
    <div className={`rounded-lg border p-4 text-sm ${TONES[tone]}`} role={tone === 'error' ? 'alert' : undefined}>
      {title ? <p className="font-semibold">{title}</p> : null}
      {children ? <div className={title ? 'mt-1' : ''}>{children}</div> : null}
    </div>
  );
}

/** Boş liste durumları için açıklayıcı kutu. */
export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
      {children}
    </p>
  );
}
