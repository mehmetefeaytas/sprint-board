'use client';

import Link from 'next/link';
import { trackStyle, type TaskRow } from '@/lib/types';
import { useDict } from '@/lib/i18n/provider';
import StatusBadge from './status-badge';

type Props = {
  task: TaskRow;
  /** Kutu tıklandığında çağrılır; iyimser güncelleme çağıran tarafta yapılır. */
  onToggleDone: (task: TaskRow) => void;
  busy?: boolean;
  showTrack?: boolean;
  dayLabel?: string;
};

export default function TaskCard({
  task,
  onToggleDone,
  busy = false,
  showTrack = false,
  dayLabel,
}: Props) {
  const t = useDict();
  const done = task.status === 'done';
  const track = trackStyle(task.track);
  const origin = task.origin_track ? trackStyle(task.origin_track) : null;

  return (
    <div
      className={`relative rounded-lg border border-slate-200 bg-white p-3 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 ${
        done ? 'opacity-60' : ''
      }`}
    >
      {/* Tüm kartı kaplayan bağlantı; içerik pointer-events-none olduğu için
          metne tıklamak da detaya götürür. */}
      <Link
        href={`/task/${task.code}`}
        className="absolute inset-0 z-10 rounded-lg focus:outline-2 focus:outline-offset-2 focus:outline-sky-500"
      >
        <span className="sr-only">{t.board.openTask(task.code)}</span>
      </Link>

      <div className="pointer-events-none relative z-20 flex gap-2">
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          aria-label={done ? t.board.uncheckDone : t.board.checkDone}
          disabled={busy}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleDone(task);
          }}
          className="pointer-events-auto -m-1 flex h-11 w-11 shrink-0 items-center justify-center disabled:opacity-50"
        >
          <span
            className={`flex h-5 w-5 items-center justify-center rounded border-2 text-xs font-bold ${
              done
                ? 'border-emerald-500 bg-emerald-500 text-white'
                : 'border-slate-300 text-transparent dark:border-slate-600'
            }`}
          >
            ✓
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[11px] tracking-tight text-slate-500 dark:text-slate-400">
              {task.code}
            </span>
            <StatusBadge status={task.status} />
            {dayLabel ? (
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {dayLabel}
              </span>
            ) : null}
            {showTrack ? (
              <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${track.chip}`}>
                {track.label}
              </span>
            ) : null}
          </div>

          <p
            className={`mt-1 text-sm leading-snug font-medium ${
              done ? 'line-through decoration-slate-400' : ''
            }`}
          >
            {task.title}
          </p>

          {task.is_blocker || origin ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {task.is_blocker ? (
                <span className="rounded-md bg-rose-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
                  {`🔴 ${t.common.blocker}`}
                </span>
              ) : null}
              {origin ? (
                <span className="rounded-md bg-indigo-100 px-1.5 py-0.5 text-[11px] font-medium text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">
                  {t.board.takeoverBadge(origin.label)}
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <span className={task.assignee_name ? '' : 'italic'}>
              {task.assignee_name ?? t.common.unassigned}
            </span>
            {task.labels.length > 0 ? (
              <span className="flex flex-wrap gap-1">
                {task.labels.map((label) => (
                  <span
                    key={label}
                    className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {label}
                  </span>
                ))}
              </span>
            ) : null}
            {task.comment_count > 0 ? (
              <span title={t.common.comments(task.comment_count)}>💬 {task.comment_count}</span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
