'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  STATUS_ORDER,
  STATUS_STYLES,
  trackStyle,
  type ActivityRow,
  type Status,
  type UserRow,
} from '@/lib/types';
import { activityTime } from '../format';
import { EmptyState } from './notice';

type Props = {
  entries: ActivityRow[];
  users: UserRow[];
  actionLabels: Record<string, string>;
  todayISO: string;
};

function isStatus(value: string): value is Status {
  return STATUS_ORDER.some((status) => status === value);
}

export default function ActivityList({ entries, users, actionLabels, todayISO }: Props) {
  const [actor, setActor] = useState('all');
  const [action, setAction] = useState('all');

  const actions = useMemo(() => {
    const present = new Set(entries.map((entry) => entry.action));
    return Array.from(present).sort((a, b) =>
      (actionLabels[a] ?? a).localeCompare(actionLabels[b] ?? b, 'tr'),
    );
  }, [entries, actionLabels]);

  const filtered = entries.filter(
    (entry) =>
      (actor === 'all' || entry.actor === actor) && (action === 'all' || entry.action === action),
  );

  function nameOf(email: string | null): string {
    if (!email) return '—';
    return users.find((user) => user.email === email)?.name ?? email;
  }

  function prettyValue(entryAction: string, value: string | null): string | null {
    if (!value) return null;
    if (entryAction === 'status' && isStatus(value)) return STATUS_STYLES[value].label;
    if (entryAction === 'assign' || entryAction === 'claim' || entryAction.startsWith('user_')) {
      return nameOf(value);
    }
    return value;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <label className="flex-1 sm:flex-none">
          <span className="block text-xs font-medium text-slate-600 dark:text-slate-400">Kişi</span>
          <select
            value={actor}
            onChange={(event) => setActor(event.target.value)}
            className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-transparent px-2 text-sm sm:w-56 dark:border-slate-700"
          >
            <option value="all">Tümü</option>
            {users.map((user) => (
              <option key={user.email} value={user.email}>
                {user.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex-1 sm:flex-none">
          <span className="block text-xs font-medium text-slate-600 dark:text-slate-400">
            Eylem
          </span>
          <select
            value={action}
            onChange={(event) => setAction(event.target.value)}
            className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-transparent px-2 text-sm sm:w-56 dark:border-slate-700"
          >
            <option value="all">Tümü</option>
            {actions.map((item) => (
              <option key={item} value={item}>
                {actionLabels[item] ?? item}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <EmptyState>
          Bu filtreye uyan kayıt yok. Filtreleri “Tümü” yaparak tüm geçmişi görebilirsiniz.
        </EmptyState>
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {filtered.map((entry) => {
            const user = users.find((item) => item.email === entry.actor);
            const from = prettyValue(entry.action, entry.from_value);
            const to = prettyValue(entry.action, entry.to_value);
            return (
              <li key={entry.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 p-3 text-sm">
                <span className="font-medium">{entry.actor_name ?? entry.actor}</span>
                {user ? (
                  <span
                    className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                      trackStyle(user.track).chip
                    }`}
                  >
                    {trackStyle(user.track).label}
                  </span>
                ) : null}
                <span className="text-slate-600 dark:text-slate-300">
                  {actionLabels[entry.action] ?? entry.action}
                </span>
                {entry.task_code ? (
                  <Link
                    href={`/task/${entry.task_code}`}
                    className="font-mono text-xs text-sky-700 hover:underline dark:text-sky-400"
                  >
                    {entry.task_code}
                  </Link>
                ) : null}
                {to ? (
                  <span className="text-slate-600 dark:text-slate-300">
                    {from ? `${from} → ` : ''}
                    {to}
                  </span>
                ) : null}
                {entry.note ? (
                  <span className="text-slate-500 dark:text-slate-400">({entry.note})</span>
                ) : null}
                <span className="ml-auto shrink-0 text-xs text-slate-400 dark:text-slate-500">
                  {activityTime(entry.created_at, todayISO)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
