'use client';

// Metinleri (erişilebilirlik etiketi ve sağdaki sayaç) prop yerine sözlükten
// okuyor: ikisi de tamamen done/total'dan türüyor, çağıranların taşıyacağı bir
// bilgi yok. Böylece mevcut props imzası da olduğu gibi kalıyor.

import { percent } from '../format';
import { useDict } from '@/lib/i18n/provider';

export default function ProgressBar({
  done,
  total,
  barClassName = 'bg-emerald-500',
  showLabel = true,
}: {
  done: number;
  total: number;
  barClassName?: string;
  showLabel?: boolean;
}) {
  const t = useDict();
  const value = percent(done, total);
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t.common.doneOfTotal(done, total)}
      >
        <div
          className={`h-full rounded-full ${barClassName}`}
          style={{ width: `${value}%` }}
        />
      </div>
      {showLabel ? (
        <span className="w-20 shrink-0 text-right text-xs tabular-nums text-slate-500 dark:text-slate-400">
          {`${done}/${total} · ${t.common.percent(value)}`}
        </span>
      ) : null}
    </div>
  );
}
