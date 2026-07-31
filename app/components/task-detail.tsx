'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  STATUS_ORDER,
  STATUS_STYLES,
  trackStyle,
  type ActivityRow,
  type CommentRow,
  type DayRow,
  type Status,
  type TaskRow,
  type UserRow,
} from '@/lib/types';
import { activityTime, shortDate, shortWeekday } from '../format';
import CommentBox from './comment-box';
import { EmptyState } from './notice';
import StatusBadge from './status-badge';

type Props = {
  initialTask: TaskRow;
  day: DayRow | null;
  users: UserRow[];
  me: { email: string; name: string; isAdmin: boolean };
  comments: CommentRow[];
  history: ActivityRow[];
  actionLabels: Record<string, string>;
  todayISO: string;
};

function isStatus(value: string): value is Status {
  return STATUS_ORDER.some((status) => status === value);
}

export default function TaskDetail({
  initialTask,
  day,
  users,
  me,
  comments,
  history,
  actionLabels,
  todayISO,
}: Props) {
  const router = useRouter();
  const [task, setTask] = useState<TaskRow>(initialTask);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');

  const track = trackStyle(task.track);
  const origin = task.origin_track ? trackStyle(task.origin_track) : null;

  function nameOf(email: string | null): string {
    if (!email) return 'Atanmadı';
    return users.find((user) => user.email === email)?.name ?? email;
  }

  async function failMessage(response: Response, fallback: string): Promise<string> {
    const payload: unknown = await response.json().catch(() => null);
    if (payload && typeof payload === 'object' && 'error' in payload) {
      return String((payload as { error: unknown }).error);
    }
    return fallback;
  }

  async function patch(patchBody: Record<string, string | null>, optimistic: TaskRow) {
    const previous = task;
    setTask(optimistic);
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchBody),
      });
      if (!response.ok) {
        setTask(previous);
        setError(await failMessage(response, 'Değişiklik kaydedilemedi.'));
        return;
      }
      setTask((await response.json()) as TaskRow);
      router.refresh();
    } catch {
      setTask(previous);
      setError('Sunucuya ulaşılamadı. Değişiklik kaydedilemedi.');
    } finally {
      setBusy(false);
    }
  }

  async function changeLabel(label: string, add: boolean) {
    const trimmed = label.trim();
    if (!trimmed) return;
    const previous = task;
    setTask({
      ...task,
      labels: add
        ? Array.from(new Set([...task.labels, trimmed])).sort()
        : task.labels.filter((item) => item !== trimmed),
    });
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/tasks/${task.id}/labels`, {
        method: add ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: trimmed }),
      });
      if (!response.ok) {
        setTask(previous);
        setError(await failMessage(response, 'Etiket güncellenemedi.'));
        return;
      }
      if (add) setNewLabel('');
      router.refresh();
    } catch {
      setTask(previous);
      setError('Sunucuya ulaşılamadı. Etiket güncellenemedi.');
    } finally {
      setBusy(false);
    }
  }

  async function removeTask() {
    if (!window.confirm(`${task.code} görevini kalıcı olarak silmek istediğinize emin misiniz?`)) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
      if (!response.ok) {
        setError(await failMessage(response, 'Görev silinemedi.'));
        return;
      }
      router.push('/');
      router.refresh();
    } catch {
      setError('Sunucuya ulaşılamadı. Görev silinemedi.');
    } finally {
      setBusy(false);
    }
  }

  /** Aktivite satırındaki from/to değerlerini okunur hale getirir. */
  function prettyValue(action: string, value: string | null): string | null {
    if (!value) return null;
    if (action === 'status' && isStatus(value)) return STATUS_STYLES[value].label;
    if (action === 'assign' || action === 'claim') return nameOf(value);
    return value;
  }

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/"
          className="text-sm text-slate-500 hover:underline dark:text-slate-400"
        >
          ← Panoya dön
        </Link>
      </div>

      <header className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{task.code}</span>
          <StatusBadge status={task.status} />
          <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${track.chip}`}>
            {track.label}
          </span>
          {day ? (
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Gün {day.day_no} · {shortWeekday(day.weekday)} {shortDate(day.date)}
            </span>
          ) : null}
          {task.is_blocker ? (
            <span className="rounded-md bg-rose-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
              🔴 BLOKER
            </span>
          ) : null}
        </div>

        <h1 className="mt-2 text-xl font-semibold">{task.title}</h1>

        {origin ? (
          <p className="mt-2 rounded-lg bg-indigo-50 p-2 text-sm text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">
            {`🤝 Devralınabilir iş · ${origin.label} track'inden geldi.`}
          </p>
        ) : null}

        {task.detail ? (
          <div className="mt-3">
            <h2 className="text-xs font-semibold text-slate-500 uppercase dark:text-slate-400">
              Açıklama
            </h2>
            <p className="mt-1 text-sm whitespace-pre-wrap">{task.detail}</p>
          </div>
        ) : null}

        {task.output ? (
          <div className="mt-3">
            <h2 className="text-xs font-semibold text-slate-500 uppercase dark:text-slate-400">
              Beklenen çıktı
            </h2>
            <p className="mt-1 text-sm">{task.output}</p>
          </div>
        ) : null}
      </header>

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200"
        >
          {error}
        </p>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-semibold">Durum</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {STATUS_ORDER.map((status) => {
            const active = task.status === status;
            return (
              <button
                key={status}
                type="button"
                disabled={busy || active}
                onClick={() => void patch({ status }, { ...task, status })}
                className={`flex h-11 items-center gap-2 rounded-lg border px-3 text-sm font-medium disabled:opacity-100 ${
                  active
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${STATUS_STYLES[status].dot}`}
                  aria-hidden="true"
                />
                {STATUS_STYLES[status].label}
              </button>
            );
          })}
        </div>

        <h2 className="mt-5 text-base font-semibold">Atama</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select
            value={task.assignee ?? ''}
            disabled={busy}
            onChange={(event) => {
              const value = event.target.value;
              void patch(
                { assignee: value || null },
                {
                  ...task,
                  assignee: value || null,
                  assignee_name: value ? nameOf(value) : null,
                },
              );
            }}
            className="h-11 min-w-48 rounded-lg border border-slate-300 bg-transparent px-2 text-sm dark:border-slate-700"
          >
            <option value="">Atanmadı</option>
            {users.map((user) => (
              <option key={user.email} value={user.email}>
                {user.name} · {trackStyle(user.track).label}
              </option>
            ))}
          </select>
          {task.assignee ? (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void patch({ assignee: null }, { ...task, assignee: null, assignee_name: null })
              }
              className="h-11 rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-700"
            >
              Atamayı kaldır
            </button>
          ) : null}
          {task.assignee !== me.email ? (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void patch(
                  { assignee: me.email },
                  { ...task, assignee: me.email, assignee_name: me.name },
                )
              }
              className="h-11 rounded-lg border border-indigo-400 px-3 text-sm font-medium text-indigo-700 dark:border-indigo-700 dark:text-indigo-300"
            >
              Bana ata
            </button>
          ) : null}
        </div>

        <h2 className="mt-5 text-base font-semibold">Etiketler</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {task.labels.length === 0 ? (
            <span className="text-sm text-slate-500 dark:text-slate-400">Etiket yok.</span>
          ) : (
            task.labels.map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 rounded-md bg-slate-100 py-0.5 pr-1 pl-2 text-xs dark:bg-slate-800"
              >
                {label}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void changeLabel(label, false)}
                  aria-label={`${label} etiketini kaldır`}
                  className="flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:text-rose-600"
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={newLabel}
            onChange={(event) => setNewLabel(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void changeLabel(newLabel, true);
              }
            }}
            placeholder="Yeni etiket"
            className="h-11 flex-1 rounded-lg border border-slate-300 bg-transparent px-3 text-sm dark:border-slate-700"
          />
          <button
            type="button"
            disabled={busy || !newLabel.trim()}
            onClick={() => void changeLabel(newLabel, true)}
            className="h-11 rounded-lg border border-slate-300 px-3 text-sm disabled:opacity-50 dark:border-slate-700"
          >
            Ekle
          </button>
        </div>
      </section>

      <CommentBox
        taskId={task.id}
        initialComments={comments}
        users={users}
        todayISO={todayISO}
      />

      <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-semibold">Bu görevin geçmişi</h2>
        {history.length === 0 ? (
          <div className="mt-3">
            <EmptyState>Bu görev için henüz kayıt yok.</EmptyState>
          </div>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {history.map((entry) => {
              const from = prettyValue(entry.action, entry.from_value);
              const to = prettyValue(entry.action, entry.to_value);
              return (
                <li key={entry.id} className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-medium">{entry.actor_name ?? entry.actor}</span>
                  <span className="text-slate-600 dark:text-slate-300">
                    {actionLabels[entry.action] ?? entry.action}
                  </span>
                  {to ? (
                    <span className="text-slate-600 dark:text-slate-300">
                      : {from ? `${from} → ` : ''}
                      {to}
                    </span>
                  ) : null}
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    · {activityTime(entry.created_at, todayISO)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {me.isAdmin ? (
        <section className="rounded-lg border border-rose-300 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950">
          <h2 className="text-base font-semibold text-rose-800 dark:text-rose-200">
            Yönetici işlemi
          </h2>
          <p className="mt-1 text-sm text-rose-700 dark:text-rose-300">
            Silinen görev geri getirilemez; yorumları ve etiketleri de silinir.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void removeTask()}
            className="mt-3 h-11 rounded-lg bg-rose-600 px-4 text-sm font-medium text-white disabled:opacity-60"
          >
            Görevi sil
          </button>
        </section>
      ) : null}
    </div>
  );
}
