// sprint.config.ts'i okur, doğrular ve uygulamanın geri kalanının kullandığı
// türetilmiş sabitleri üretir.
//
// Doğrulama modül yüklenirken çalışır: hatalı bir yapılandırma sessizce
// bozuk bir panoya değil, ilk istekte net bir hata mesajına dönüşür.

import raw from '@/sprint.config';
import { normalizeLabel } from './labels';
import type {
  DayDef,
  SprintConfig,
  Status,
  TaskDef,
  Track,
  TrackColor,
  TrackDef,
  UserDef,
} from './config-types';

export type { DayDef, SprintConfig, Status, TaskDef, Track, TrackColor, TrackDef, UserDef };

/** Tailwind sınıfları derleme anında taranır; bu yüzden renkler sabit yazılır. */
const PALETTE: Record<TrackColor, { accent: string; chip: string }> = {
  indigo: {
    accent: 'border-l-indigo-500',
    chip: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
  },
  teal: {
    accent: 'border-l-teal-500',
    chip: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
  },
  sky: {
    accent: 'border-l-sky-500',
    chip: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  },
  rose: {
    accent: 'border-l-rose-500',
    chip: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
  },
  amber: {
    accent: 'border-l-amber-500',
    chip: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  },
  violet: {
    accent: 'border-l-violet-500',
    chip: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300',
  },
  emerald: {
    accent: 'border-l-emerald-500',
    chip: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
  slate: {
    accent: 'border-l-slate-400',
    chip: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
};

export const STATUSES: readonly Status[] = ['todo', 'in_progress', 'blocked', 'done'];

const KEY_PATTERN = /^[A-Z0-9_]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function validate(config: SprintConfig): string[] {
  const problems: string[] = [];
  const note = (message: string) => problems.push(message);

  if (typeof config.projectName !== 'string' || config.projectName.trim() === '') {
    note('projectName cannot be empty.');
  }

  if (config.defaultLocale !== undefined && !['tr', 'en'].includes(config.defaultLocale)) {
    note(`defaultLocale "${config.defaultLocale}" is invalid — it must be 'tr' or 'en'.`);
  }

  // ── Track'ler ──────────────────────────────────────────────────────────────
  const trackKeys = new Set<string>();
  const abbrs = new Set<string>();
  if (config.tracks.length === 0) note('At least one track must be defined.');
  for (const track of config.tracks) {
    if (!KEY_PATTERN.test(track.key)) {
      note(`Track key "${track.key}" is invalid — only A-Z, 0-9 and underscore.`);
    }
    if (trackKeys.has(track.key)) note(`Track key "${track.key}" is defined twice.`);
    trackKeys.add(track.key);

    if (track.abbr.trim() === '') note(`abbr is empty for track "${track.key}".`);
    if (abbrs.has(track.abbr)) {
      note(`Track abbreviation "${track.abbr}" is used twice — task codes would collide.`);
    }
    abbrs.add(track.abbr);

    if (!(track.color in PALETTE)) {
      note(
        `Colour "${track.color}" on track "${track.key}" is not defined. ` +
          `Valid colours: ${Object.keys(PALETTE).join(', ')}.`,
      );
    }
  }

  // ── Kişiler ───────────────────────────────────────────────────────────────
  const emails = new Set<string>();
  if (config.users.length === 0) note('At least one person must be defined.');
  if (!config.users.some((user) => user.is_admin === true)) {
    note('At least one person needs is_admin: true, otherwise nobody can manage the team.');
  }
  for (const user of config.users) {
    const email = user.email.trim().toLowerCase();
    if (!email.includes('@')) note(`Invalid email: "${user.email}".`);
    if (emails.has(email)) note(`Email "${email}" is defined twice.`);
    emails.add(email);
    if (user.name.trim() === '') note(`The name for "${email}" is empty.`);
    if (!trackKeys.has(user.track)) {
      note(`"${email}" points at an undefined track: "${user.track}".`);
    }
  }

  // ── Günler ────────────────────────────────────────────────────────────────
  const dayNumbers = new Set<number>();
  if (config.days.length === 0) note('At least one day must be defined.');
  for (const day of config.days) {
    if (!Number.isInteger(day.day_no) || day.day_no <= 0) {
      note(`Invalid day_no: ${day.day_no} — it must be a positive integer.`);
    }
    if (dayNumbers.has(day.day_no)) note(`day_no ${day.day_no} is defined twice.`);
    dayNumbers.add(day.day_no);
    if (!DATE_PATTERN.test(day.date)) {
      note(`The date "${day.date}" on day ${day.day_no} is not in YYYY-MM-DD form.`);
    }
    if (day.weekday !== undefined && day.weekday.trim() === '') {
      note(`weekday on day ${day.day_no} is an empty string — either fill it in or leave it out.`);
    }
    if (day.theme.trim() === '') note(`theme is empty on day ${day.day_no}.`);
  }

  // ── Görevler ──────────────────────────────────────────────────────────────
  const codes = new Set<string>();
  for (const task of config.tasks) {
    if (task.code.trim() === '') {
      note('A task has an empty code — the code is its permanent identity and is required.');
    }
    if (codes.has(task.code)) note(`Task code "${task.code}" is used twice.`);
    codes.add(task.code);

    if (!dayNumbers.has(task.day_no)) {
      note(`"${task.code}" points at an undefined day: ${task.day_no}.`);
    }
    if (!trackKeys.has(task.track)) {
      note(`"${task.code}" points at an undefined track: "${task.track}".`);
    }
    if (task.origin_track !== undefined && !trackKeys.has(task.origin_track)) {
      note(`"${task.code}" points at an undefined origin_track: "${task.origin_track}".`);
    }
    if (task.status !== undefined && !STATUSES.includes(task.status)) {
      note(`Invalid status on "${task.code}": "${task.status}".`);
    }
    if (task.assignee !== undefined && !emails.has(task.assignee.trim().toLowerCase())) {
      note(`"${task.code}" is assigned to someone not in users: "${task.assignee}".`);
    }
    if (task.title.trim() === '') note(`The title on "${task.code}" is empty.`);
  }

  return problems;
}

const problems = validate(raw);
if (problems.length > 0) {
  throw new Error(
    `sprint.config.ts is invalid:\n${problems.map((p) => `  • ${p}`).join('\n')}`,
  );
}

export const SPRINT = raw;
export const PROJECT_NAME = raw.projectName;

/** Tarih ve saatler bu dilimde biçimlenir — sunucu ile istemci çıktısı
 *  aynı olsun diye sabit; makinenin yerel saatine güvenilmez. */
export const TIME_ZONE = raw.timezone ?? 'Europe/Istanbul';
export const PROJECT_DESCRIPTION = raw.description ?? '';

/** Track anahtarları — panoda ve formlarda bu sıra kullanılır. */
export const TRACKS: readonly Track[] = raw.tracks.map((track) => track.key);

export const TRACK_LABELS: Record<Track, string> = Object.fromEntries(
  raw.tracks.map((track) => [track.key, track.label]),
);

export const TRACK_ABBR: Record<Track, string> = Object.fromEntries(
  raw.tracks.map((track) => [track.key, track.abbr]),
);

/** İlk track; bilinmeyen bir değer geldiğinde geri düşülen varsayılan. */
export const DEFAULT_TRACK: Track = raw.tracks[0].key;

export type TrackStyle = { label: string; accent: string; chip: string };

const STYLES: Record<Track, TrackStyle> = Object.fromEntries(
  raw.tracks.map((track) => [
    track.key,
    { label: track.label, ...PALETTE[track.color] },
  ]),
);

/**
 * Track'in arayüz stili. Yapılandırmadan kaldırılmış ama veritabanında veya
 * eski bir oturum çerezinde kalmış bir track çökme değil, nötr bir görünüm
 * üretir — bu yüzden indeksleme değil fonksiyon.
 */
export function trackStyle(track: Track): TrackStyle {
  return STYLES[track] ?? { label: track, ...PALETTE.slate };
}

export function isKnownTrack(value: unknown): value is Track {
  return typeof value === 'string' && Object.hasOwn(STYLES, value);
}

export const USERS = raw.users.map((user) => ({
  email: user.email.trim().toLowerCase(),
  name: user.name,
  track: user.track,
  is_admin: user.is_admin === true,
}));

/** Panodan çıkarılamayan hesaplar: yapılandırmada yönetici işaretli olanlar. */
export const PROTECTED_EMAILS: readonly string[] = USERS.filter((user) => user.is_admin).map(
  (user) => user.email,
);

export const SPRINT_DAYS = raw.days
  .map((day) => ({
    day_no: day.day_no,
    date: day.date,
    weekday: day.weekday ?? null,
    theme: day.theme,
    milestone: day.milestone ?? null,
  }))
  .sort((a, b) => a.day_no - b.day_no);

export const TASKS = raw.tasks.map((task) => ({
  code: task.code,
  day_no: task.day_no,
  track: task.track,
  origin_track: task.origin_track ?? null,
  title: task.title,
  detail: task.detail ?? null,
  output: task.output ?? null,
  status: task.status ?? ('todo' as Status),
  assignee: task.assignee?.trim().toLowerCase() ?? null,
  is_blocker: task.is_blocker === true,
  labels: (task.labels ?? []).map(normalizeLabel).filter(Boolean),
}));
