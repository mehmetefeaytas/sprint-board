'use client';

import { useEffect, useState } from 'react';
import { trackStyle, type DayRow, type TaskRow, type Track, type UserRow } from '@/lib/types';
import { TRACKS } from '@/lib/config';
import { shortDate, shortWeekday } from '../format';
import { useDict, useLocale } from '@/lib/i18n/provider';

type Props = {
  days: DayRow[];
  users: UserRow[];
  defaultDay: number;
  defaultTrack: Track;
  onCreated: (task: TaskRow) => void;
  onClose: () => void;
};

export default function NewTaskForm({
  days,
  users,
  defaultDay,
  defaultTrack,
  onCreated,
  onClose,
}: Props) {
  const t = useDict();
  const locale = useLocale();
  const [dayNo, setDayNo] = useState(defaultDay);
  const [track, setTrack] = useState<Track>(defaultTrack);
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [assignee, setAssignee] = useState('');
  const [labels, setLabels] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError(t.board.form.titleRequired);
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day_no: dayNo,
          track,
          title: title.trim(),
          detail: detail.trim() || null,
          assignee: assignee || null,
          labels: labels
            .split(',')
            .map((part) => part.trim())
            .filter(Boolean),
        }),
      });
      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        const message =
          body && typeof body === 'object' && 'error' in body
            ? String((body as { error: unknown }).error)
            : t.board.form.createFailed;
        setError(message);
        return;
      }
      const created = (await response.json()) as TaskRow;
      onCreated(created);
      onClose();
    } catch {
      setError(t.board.form.networkError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t.board.newTaskTitle}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={submit}
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold">{t.board.newTaskTitle}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.action.close}
            className="-m-2 flex h-11 w-11 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {t.board.form.day}
            </span>
            <select
              value={dayNo}
              onChange={(event) => setDayNo(Number(event.target.value))}
              className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-transparent px-2 text-sm dark:border-slate-700"
            >
              {days.map((day) => (
                <option key={day.day_no} value={day.day_no}>
                  {`${t.board.day(day.day_no)} · ${shortWeekday(day.date, day.weekday, locale)} ${shortDate(day.date, locale)}`}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {t.board.form.track}
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
        </div>

        <label className="mt-3 block">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {t.board.form.title}
          </span>
          <input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t.board.form.titlePlaceholder}
            className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-transparent px-3 text-sm dark:border-slate-700"
          />
        </label>

        <label className="mt-3 block">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {t.board.form.detail}
          </span>
          <textarea
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
          />
        </label>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {t.board.form.assignee}
            </span>
            <select
              value={assignee}
              onChange={(event) => setAssignee(event.target.value)}
              className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-transparent px-2 text-sm dark:border-slate-700"
            >
              <option value="">{t.common.unassigned}</option>
              {users.map((user) => (
                <option key={user.email} value={user.email}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {t.board.form.labels}
            </span>
            <input
              value={labels}
              onChange={(event) => setLabels(event.target.value)}
              placeholder={t.board.form.labelsPlaceholder}
              className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-transparent px-3 text-sm dark:border-slate-700"
            />
          </label>
        </div>

        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          {t.board.form.hint(t.common.status.todo)}
        </p>

        {error ? (
          <p className="mt-3 rounded-lg bg-rose-50 p-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-200">
            {error}
          </p>
        ) : null}

        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="h-11 flex-1 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
          >
            {saving ? t.common.state.saving : t.board.form.submit}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-lg border border-slate-300 px-4 text-sm dark:border-slate-700"
          >
            {t.board.form.discard}
          </button>
        </div>
      </form>
    </div>
  );
}
