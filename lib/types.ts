// API ile UI arasındaki tek sözleşme. Hem route handler'lar hem ekranlar
// bu tipleri kullanır; buradan sapan bir alan eklenmemeli.

import type { Status, Track } from './config-types';
import { trackStyle, type TrackStyle } from './config';

export type { Status, Track, TrackStyle };
export { trackStyle };

export type UserRow = {
  email: string;
  name: string;
  track: Track;
  is_admin: boolean;
};

export type DayRow = {
  day_no: number;
  date: string; // YYYY-MM-DD
  weekday: string;
  theme: string;
  milestone: string | null;
};

export type TaskRow = {
  id: number;
  code: string;
  day_no: number;
  track: Track;
  origin_track: Track | null;
  title: string;
  detail: string | null;
  output: string | null;
  status: Status;
  assignee: string | null;
  assignee_name: string | null;
  is_blocker: boolean;
  sort_order: number;
  created_by: string | null;
  completed_at: string | null;
  completed_by: string | null;
  labels: string[];
  comment_count: number;
};

export type CommentRow = {
  id: number;
  task_id: number;
  author: string;
  author_name: string;
  body: string;
  created_at: string;
  mentions: string[];
};

export type ActivityRow = {
  id: number;
  actor: string;
  actor_name: string | null;
  action: string;
  task_id: number | null;
  task_code: string | null;
  from_value: string | null;
  to_value: string | null;
  note: string | null;
  created_at: string;
};

/** GET /api/board — board'un tek seferde ihtiyaç duyduğu her şey. */
export type BoardPayload = {
  me: { email: string; name: string; track: Track; isAdmin: boolean };
  days: DayRow[];
  tasks: TaskRow[];
  users: UserRow[];
};

export const STATUS_ORDER: Status[] = ['todo', 'in_progress', 'blocked', 'done'];

export const STATUS_STYLES: Record<Status, { label: string; dot: string; chip: string }> = {
  todo: {
    label: 'Yapılacak',
    dot: 'bg-slate-400',
    chip: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
  in_progress: {
    label: 'Devam ediyor',
    dot: 'bg-amber-500',
    chip: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  },
  blocked: {
    label: 'Bloke',
    dot: 'bg-rose-500',
    chip: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
  },
  done: {
    label: 'Tamamlandı',
    dot: 'bg-emerald-500',
    chip: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
};
