import { percent } from '../format';

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
  const value = percent(done, total);
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${done} / ${total} tamamlandı`}
      >
        <div
          className={`h-full rounded-full ${barClassName}`}
          style={{ width: `${value}%` }}
        />
      </div>
      {showLabel ? (
        <span className="w-20 shrink-0 text-right text-xs tabular-nums text-slate-500 dark:text-slate-400">
          {done}/{total} · %{value}
        </span>
      ) : null}
    </div>
  );
}
