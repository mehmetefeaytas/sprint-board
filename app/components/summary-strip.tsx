import { trackStyle, type TaskRow, type UserRow } from '@/lib/types';
import { businessDaysUntil, longDate, percent } from '../format';
import ProgressBar from './progress-bar';

type Props = {
  tasks: TaskRow[];
  users: UserRow[];
  todayISO: string;
  demoDateISO: string | null;
};

function demoText(todayISO: string, demoDateISO: string | null): string {
  if (!demoDateISO) return 'Demo tarihi tanımlı değil';
  if (demoDateISO === todayISO) return 'Demo bugün 🎯';
  if (demoDateISO < todayISO) return 'Demo tarihi geçti';
  const days = businessDaysUntil(todayISO, demoDateISO);
  return `Demoya ${days} iş günü`;
}

export default function SummaryStrip({ tasks, users, todayISO, demoDateISO }: Props) {
  const total = tasks.length;
  const done = tasks.filter((task) => task.status === 'done').length;
  const blocked = tasks.filter((task) => task.status === 'blocked' || task.is_blocker).length;
  const unassigned = tasks.filter((task) => !task.assignee).length;

  const perUser = users
    .map((user) => {
      const own = tasks.filter((task) => task.assignee === user.email);
      return {
        user,
        total: own.length,
        done: own.filter((task) => task.status === 'done').length,
      };
    })
    .sort((a, b) => b.total - a.total);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Sprint ilerlemesi</p>
          <p className="text-3xl font-semibold tabular-nums">%{percent(done, total)}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {done} / {total} görev tamamlandı
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold">{demoText(todayISO, demoDateISO)}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Bugün {longDate(todayISO)}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {blocked} bloke/bloker · {unassigned} atanmamış
          </p>
        </div>
      </div>

      <div className="mt-3">
        <ProgressBar done={done} total={total} showLabel={false} />
      </div>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {perUser.map(({ user, total: userTotal, done: userDone }) => (
          <li key={user.email} className="flex items-center gap-2">
            <span className="w-28 shrink-0 truncate text-sm" title={user.name}>
              {user.name}
            </span>
            <span
              className={`hidden shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium sm:inline ${
                trackStyle(user.track).chip
              }`}
            >
              {trackStyle(user.track).label}
            </span>
            <span className="min-w-0 flex-1">
              <ProgressBar done={userDone} total={userTotal} barClassName="bg-sky-500" />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
