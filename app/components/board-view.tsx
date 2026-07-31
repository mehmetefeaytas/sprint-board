'use client';

import { useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import {
  STATUS_ORDER,
  STATUS_STYLES,
  trackStyle,
  type BoardPayload,
  type TaskRow,
  type Track,
} from '@/lib/types';
import { TRACKS } from '@/lib/config';
import { shortDate, shortWeekday } from '../format';
import { EmptyState } from './notice';
import NewTaskForm from './new-task-form';
import SummaryStrip from './summary-strip';
import TaskCard from './task-card';
import { readView, serverView, subscribeView, writeView } from './view-store';

const TRACK_ORDER: readonly Track[] = TRACKS;

export default function BoardView({
  payload,
  todayISO,
}: {
  payload: BoardPayload;
  todayISO: string;
}) {
  const router = useRouter();
  const { days, users, me } = payload;

  const [tasks, setTasks] = useState<TaskRow[]>(payload.tasks);
  // Sunucudan yeni veri geldiğinde (router.refresh) yerel kopyayı tazele.
  const [seenTasks, setSeenTasks] = useState<TaskRow[]>(payload.tasks);
  if (seenTasks !== payload.tasks) {
    setSeenTasks(payload.tasks);
    setTasks(payload.tasks);
  }

  const view = useSyncExternalStore(subscribeView, readView, serverView);

  const todayDay = days.find((day) => day.date === todayISO);
  const [dayNo, setDayNo] = useState<number>(todayDay?.day_no ?? days[0]?.day_no ?? 0);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const selectedDay = days.find((day) => day.day_no === dayNo) ?? days[0] ?? null;
  const demoDay = days.find((day) => day.milestone);

  async function patchTask(
    task: TaskRow,
    patch: Record<string, string | null>,
    optimistic: TaskRow,
  ) {
    const previous = tasks;
    setTasks((list) => list.map((item) => (item.id === task.id ? optimistic : item)));
    setBusyId(task.id);
    setError(null);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        const message =
          body && typeof body === 'object' && 'error' in body
            ? String((body as { error: unknown }).error)
            : 'Değişiklik kaydedilemedi.';
        throw new Error(message);
      }
      const updated = (await response.json()) as TaskRow;
      setTasks((list) => list.map((item) => (item.id === updated.id ? updated : item)));
      router.refresh();
    } catch (caught) {
      // İyimser güncellemeyi geri al.
      setTasks(previous);
      setError(caught instanceof Error ? caught.message : 'Değişiklik kaydedilemedi.');
    } finally {
      setBusyId(null);
    }
  }

  function toggleDone(task: TaskRow) {
    const next = task.status === 'done' ? 'todo' : 'done';
    void patchTask(task, { status: next }, { ...task, status: next });
  }

  function claim(task: TaskRow) {
    void patchTask(
      task,
      { assignee: me.email },
      { ...task, assignee: me.email, assignee_name: me.name },
    );
  }

  const handoverTasks = tasks.filter((task) => task.origin_track);
  const dayTasks = tasks.filter((task) => task.day_no === dayNo && !task.origin_track);

  return (
    <div className="space-y-5">
      <SummaryStrip
        tasks={tasks}
        users={users}
        todayISO={todayISO}
        demoDateISO={demoDay?.date ?? null}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          className="inline-flex rounded-lg border border-slate-300 p-0.5 dark:border-slate-700"
          role="tablist"
          aria-label="Görünüm"
        >
          <button
            type="button"
            role="tab"
            aria-selected={view === 'calendar'}
            onClick={() => writeView('calendar')}
            className={`h-10 rounded-md px-3 text-sm font-medium ${
              view === 'calendar'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Takvim
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'board'}
            onClick={() => writeView('board')}
            className={`h-10 rounded-md px-3 text-sm font-medium ${
              view === 'board'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Pano
          </button>
        </div>

        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="h-11 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900"
        >
          + Yeni görev
        </button>
      </div>

      {view === 'calendar' ? (
        <>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {days.map((day) => {
              const active = day.day_no === dayNo;
              return (
                <button
                  key={day.day_no}
                  type="button"
                  onClick={() => setDayNo(day.day_no)}
                  aria-current={active ? 'true' : undefined}
                  className={`flex h-11 shrink-0 items-center gap-1 rounded-lg border px-3 text-sm font-medium ${
                    active
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                      : 'border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-200'
                  }`}
                >
                  <span>Gün {day.day_no}</span>
                  <span className="opacity-70">·</span>
                  <span className="opacity-90">
                    {shortWeekday(day.weekday)} {shortDate(day.date)}
                  </span>
                  {day.milestone ? <span aria-label="Kilometre taşı">🎯</span> : null}
                  {day.date === todayISO ? (
                    <span className="rounded bg-sky-500 px-1 text-[10px] font-bold text-white">
                      BUGÜN
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {selectedDay ? (
            <div>
              <h2 className="text-lg font-semibold">{selectedDay.theme}</h2>
              {selectedDay.milestone ? (
                <p className="mt-1 inline-block rounded-lg bg-amber-100 px-2 py-1 text-sm font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                  🎯 {selectedDay.milestone}
                </p>
              ) : null}
            </div>
          ) : null}

          {dayTasks.length === 0 ? (
            <EmptyState>Bu günde görev yok. Üstteki “+ Yeni görev” ile ekleyebilirsiniz.</EmptyState>
          ) : (
            <div className="space-y-4">
              {TRACK_ORDER.map((track) => {
                const trackTasks = dayTasks.filter((task) => task.track === track);
                if (trackTasks.length === 0) return null;
                const style = trackStyle(track);
                const trackDone = trackTasks.filter((task) => task.status === 'done').length;
                return (
                  <section
                    key={track}
                    className={`rounded-lg border border-l-4 border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 ${style.accent}`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold">{style.label}</h3>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {trackDone}/{trackTasks.length} tamam
                      </span>
                    </div>
                    <div className="grid gap-2 lg:grid-cols-2">
                      {trackTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          busy={busyId === task.id}
                          onToggleDone={toggleDone}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-semibold">🤝 Devralınabilir işler</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Yapay Zekâ track&apos;i tamamlandığı için bu işler devralınmayı bekliyor.
            </p>
            {handoverTasks.length === 0 ? (
              <div className="mt-3">
                <EmptyState>Şu anda devralınmayı bekleyen iş yok.</EmptyState>
              </div>
            ) : (
              <ul className="mt-3 space-y-2">
                {handoverTasks.map((task) => (
                  <li key={task.id} className="space-y-2">
                    <TaskCard
                      task={task}
                      busy={busyId === task.id}
                      onToggleDone={toggleDone}
                      showTrack
                      dayLabel={`Gün ${task.day_no}`}
                    />
                    <div className="flex items-center gap-2 pl-1">
                      {task.assignee === me.email ? (
                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                          Bu işi devraldınız.
                        </span>
                      ) : task.assignee ? (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {task.assignee_name} devraldı.
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => claim(task)}
                          disabled={busyId === task.id}
                          className="h-11 rounded-lg border border-indigo-400 px-3 text-sm font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-60 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-950"
                        >
                          {busyId === task.id ? 'Devralınıyor…' : 'Bu işi devral'}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {STATUS_ORDER.map((status) => {
            const columnTasks = tasks.filter((task) => task.status === status);
            const style = STATUS_STYLES[status];
            return (
              <section
                key={status}
                className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${style.dot}`} aria-hidden="true" />
                  <h3 className="text-sm font-semibold">{style.label}</h3>
                  <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">
                    {columnTasks.length}
                  </span>
                </div>
                {columnTasks.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">
                    Bu kolonda görev yok.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {columnTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        busy={busyId === task.id}
                        onToggleDone={toggleDone}
                        showTrack
                        dayLabel={`Gün ${task.day_no}`}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {formOpen ? (
        <NewTaskForm
          days={days}
          users={users}
          defaultDay={dayNo}
          defaultTrack={me.track}
          onCreated={(task) => {
            setTasks((list) => [...list, task]);
            router.refresh();
          }}
          onClose={() => setFormOpen(false)}
        />
      ) : null}

      {error ? (
        <div
          role="alert"
          className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-md items-start gap-3 rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800 shadow-lg dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200"
        >
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Uyarıyı kapat"
            className="font-bold"
          >
            ✕
          </button>
        </div>
      ) : null}
    </div>
  );
}
