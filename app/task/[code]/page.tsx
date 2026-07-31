import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { ACTION_LABELS } from '@/lib/audit';
import type { ActivityRow, CommentRow, DayRow, TaskRow, UserRow } from '@/lib/types';
import {
  getComments,
  getDays,
  getTaskActivity,
  getTaskByCode,
  getUsers,
  readableDbError,
} from '../../board-data';
import { dayKey } from '../../format';
import TaskDetail from '../../components/task-detail';
import { Notice } from '../../components/notice';

type Loaded = {
  task: TaskRow | null;
  users: UserRow[];
  days: DayRow[];
  comments: CommentRow[];
  history: ActivityRow[];
};

async function load(code: string): Promise<Loaded> {
  const [task, users, days] = await Promise.all([getTaskByCode(code), getUsers(), getDays()]);
  let comments: CommentRow[] = [];
  let history: ActivityRow[] = [];
  if (task) {
    [comments, history] = await Promise.all([getComments(task.id), getTaskActivity(task.code)]);
  }
  return { task, users, days, comments, history };
}

export default async function TaskPage(props: { params: Promise<{ code: string }> }) {
  const { code } = await props.params;
  const session = await getSession();
  if (!session) redirect('/giris');

  let data: Loaded | null = null;
  let error: string | null = null;
  try {
    data = await load(code);
  } catch (caught) {
    error = readableDbError(caught);
  }

  if (!data) {
    return (
      <Notice tone="error" title="Görev yüklenemedi">
        {error}
      </Notice>
    );
  }

  const { task, users, days, comments, history } = data;
  if (!task) notFound();

  const day = days.find((item) => item.day_no === task.day_no) ?? null;

  return (
    <TaskDetail
      initialTask={task}
      day={day}
      users={users}
      me={{ email: session.email, name: session.name, isAdmin: session.isAdmin }}
      comments={comments}
      history={history}
      actionLabels={ACTION_LABELS}
      todayISO={dayKey()}
    />
  );
}
