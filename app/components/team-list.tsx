'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trackStyle, type UserRow } from '@/lib/types';
import ProgressBar from './progress-bar';
import { EmptyState } from './notice';

export type Member = {
  user: UserRow;
  total: number;
  done: number;
};

type Props = {
  members: Member[];
  /** Sunucu belirler; false ise çıkarma düğmesi hiç render edilmez. */
  isAdmin: boolean;
  /** Bu e-postalar hiçbir koşulda çıkarılamaz (yapılandırmadaki yöneticiler). */
  protectedEmails: readonly string[];
};

export default function TeamList({ members, isAdmin, protectedEmails }: Props) {
  const router = useRouter();
  const [busyEmail, setBusyEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function remove(user: UserRow) {
    if (!window.confirm(`${user.name} ekipten çıkarılsın mı?`)) return;
    setBusyEmail(user.email);
    setError(null);
    try {
      const response = await fetch(`/api/users?email=${encodeURIComponent(user.email)}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => null);
        setError(
          payload && typeof payload === 'object' && 'error' in payload
            ? String((payload as { error: unknown }).error)
            : 'Kişi çıkarılamadı.',
        );
        return;
      }
      router.refresh();
    } catch {
      setError('Sunucuya ulaşılamadı. Kişi çıkarılamadı.');
    } finally {
      setBusyEmail(null);
    }
  }

  if (members.length === 0) {
    return <EmptyState>Ekipte kayıtlı kişi yok.</EmptyState>;
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200"
        >
          {error}
        </p>
      ) : null}

      <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
        {members.map(({ user, total, done }) => (
          <li key={user.email} className="p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{user.name}</span>
              <span
                className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                  trackStyle(user.track).chip
                }`}
              >
                {trackStyle(user.track).label}
              </span>
              {user.is_admin ? (
                <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[11px] font-medium text-white dark:bg-slate-100 dark:text-slate-900">
                  yönetici
                </span>
              ) : null}
              {isAdmin && !protectedEmails.includes(user.email) ? (
                <button
                  type="button"
                  disabled={busyEmail === user.email}
                  onClick={() => void remove(user)}
                  className="ml-auto h-11 rounded-lg border border-rose-300 px-3 text-sm text-rose-700 disabled:opacity-60 dark:border-rose-800 dark:text-rose-300"
                >
                  {busyEmail === user.email ? 'Çıkarılıyor…' : 'Ekipten çıkar'}
                </button>
              ) : null}
            </div>
            <p className="mt-0.5 text-xs break-all text-slate-500 dark:text-slate-400">
              {user.email}
            </p>
            <div className="mt-2">
              <ProgressBar done={done} total={total} barClassName="bg-sky-500" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
