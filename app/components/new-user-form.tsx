'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DEFAULT_TRACK, TRACKS } from '@/lib/config';
import { trackStyle, type Track } from '@/lib/types';
import { useDict } from '@/lib/i18n/provider';

export default function NewUserForm() {
  const router = useRouter();
  const t = useDict();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [track, setTrack] = useState<Track>(DEFAULT_TRACK);
  const [isAdmin, setIsAdmin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setDone(null);
    if (!name.trim() || !email.trim()) {
      setError(t.team.error.nameEmailRequired);
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          track,
          is_admin: isAdmin,
        }),
      });
      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => null);
        setError(
          payload && typeof payload === 'object' && 'error' in payload
            ? String((payload as { error: unknown }).error)
            : t.team.error.addFailed,
        );
        return;
      }
      setDone(t.team.added(name.trim()));
      setName('');
      setEmail('');
      setIsAdmin(false);
      router.refresh();
    } catch {
      setError(t.team.error.addOffline);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
    >
      <h2 className="text-base font-semibold">{t.team.addHeading}</h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t.team.addHint}</p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {t.team.nameLabel}
          </span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-transparent px-3 text-sm dark:border-slate-700"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {t.team.emailLabel}
          </span>
          <input
            type="email"
            inputMode="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-transparent px-3 text-sm dark:border-slate-700"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {t.team.trackLabel}
          </span>
          <select
            value={track}
            onChange={(event) => setTrack(event.target.value as Track)}
            className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-transparent px-2 text-sm dark:border-slate-700"
          >
            {TRACKS.map((item) => (
              <option key={item} value={item}>
                {trackStyle(item).label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex h-11 items-center gap-2 self-end">
          <input
            type="checkbox"
            checked={isAdmin}
            onChange={(event) => setIsAdmin(event.target.checked)}
            className="h-5 w-5"
          />
          <span className="text-sm">{t.team.adminCheckbox}</span>
        </label>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-3 rounded-lg bg-rose-50 p-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-200"
        >
          {error}
        </p>
      ) : null}
      {done ? (
        <p className="mt-3 rounded-lg bg-emerald-50 p-2 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
          {done}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="mt-3 h-11 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
      >
        {saving ? t.team.adding : t.team.addSubmit}
      </button>
    </form>
  );
}
