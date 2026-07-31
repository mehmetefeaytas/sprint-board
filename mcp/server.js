#!/usr/bin/env node
// Sprint Board MCP sunucusu — stdio üzerinden çalışır.
//
// Claude Code, Codex, OpenCode ve MCP konuşan diğer araçlar panoyu bu sunucu
// üzerinden okur ve günceller. Kurulum: mcp/README.md
//
// Not: yorumlar Türkçe (depo kuralı, bkz. AGENTS.md) ama sunucunun ürettiği
// her metin İngilizce. Bu çıktıyı bir ajan okuyor ve depo İngilizce öncelikli;
// web arayüzünün iki dilli sözlüğü buraya taşınmadı çünkü ortada gösterilecek
// bir kullanıcı yok.
//
// Tasarım kararları:
//
// • Web uygulamasının HTTP API'sine değil doğrudan veritabanına bağlanır.
//   Böylece yeni bir kimlik doğrulama yüzeyi (API anahtarı, servis hesabı)
//   açmak gerekmez; MCP istemcisini kuran kişi zaten DATABASE_URL'e sahip.
//
// • Her yazma işlemi activity_log'a düşer ve aktör olarak SPRINT_BOARD_ACTOR
//   yazılır. "Kim ne yaptı" izi bozulmasın diye aktör zorunludur ve panoda
//   kayıtlı bir kişi olmak zorundadır.
//
// • Silme işlemi BİLİNÇLİ olarak yok. Bir ajan yanlış anlamayla veri
//   silmesin; silme panodan, insan eliyle yapılır.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import pg from 'pg';

const STATUSES = ['todo', 'in_progress', 'blocked', 'done'];
const STATUS_LABELS = {
  todo: 'To do',
  in_progress: 'In progress',
  blocked: 'Blocked',
  done: 'Done',
};

const DATABASE_URL = process.env.DATABASE_URL;
const ACTOR = (process.env.SPRINT_BOARD_ACTOR ?? '').trim().toLowerCase();

if (!DATABASE_URL) {
  console.error(
    'DATABASE_URL is not set. Point it at the board database:\n' +
      '  DATABASE_URL=postgres://... SPRINT_BOARD_ACTOR=you@example.com node mcp/server.js',
  );
  process.exit(1);
}
if (!ACTOR || !ACTOR.includes('@')) {
  console.error(
    'SPRINT_BOARD_ACTOR is missing or is not an email address.\n' +
      'Everything you change is recorded in the activity log under this person,\n' +
      'so it has to be someone registered on the board.',
  );
  process.exit(1);
}

// Neon TCP bağlantısı TLS ister. Lokal Postgres'te TLS kapalı olur.
const isLocal = /localhost|127\.0\.0\.1|sslmode=disable/.test(DATABASE_URL);
const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  max: 2,
});

async function query(text, values = []) {
  const result = await pool.query(text, values);
  return result.rows;
}

/** Aktörün panoda kayıtlı olduğunu bir kez doğrular ve önbelleğe alır. */
let actorRow = null;
async function requireActor() {
  if (actorRow) return actorRow;
  const rows = await query('SELECT email, name, is_admin FROM users WHERE email = $1', [ACTOR]);
  if (!rows[0]) {
    throw new Error(
      `"${ACTOR}" is not registered on the board. Add them to the users list in ` +
        'sprint.config.ts and seed again, or point SPRINT_BOARD_ACTOR at a registered email.',
    );
  }
  actorRow = rows[0];
  return actorRow;
}

/** Tek audit yazma noktası — web uygulamasındaki lib/audit.ts'in karşılığı. */
async function logActivity(entry) {
  await query(
    `INSERT INTO activity_log (actor, action, task_id, task_code, from_value, to_value, note)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      ACTOR,
      entry.action,
      entry.task_id ?? null,
      entry.task_code ?? null,
      entry.from ?? null,
      entry.to ?? null,
      entry.note ?? null,
    ],
  );
}

async function findTask(code) {
  const rows = await query(
    `SELECT t.*, u.name AS assignee_name,
            COALESCE(ARRAY_AGG(DISTINCT l.label) FILTER (WHERE l.label IS NOT NULL), '{}') AS labels,
            (SELECT COUNT(*)::int FROM comments c WHERE c.task_id = t.id) AS comment_count
     FROM tasks t
     LEFT JOIN users u ON u.email = t.assignee
     LEFT JOIN task_labels l ON l.task_id = t.id
     WHERE upper(t.code) = upper($1)
     GROUP BY t.id, u.name`,
    [code],
  );
  return rows[0] ?? null;
}

/** Metin yanıtı — MCP istemcileri bunu modele gösterir. */
function text(value) {
  return { content: [{ type: 'text', text: value }] };
}

function fail(message) {
  return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
}

/**
 * lib/labels.ts içindeki normalizeLabel'in karşılığı — MCP ayrı bir paket
 * olduğu için TypeScript tarafından import edilemiyor. Kural aynı kalmalı:
 * düz toLowerCase() Türkçe "İ" harfini "i" + U+0307'ye çevirdiği için
 * "ACİL" ile "acil" farklı etiket sayılırdı.
 */
function normalizeLabel(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\u0307/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * @isim eşleşmesi için ad katlama — web tarafındaki
 * app/api/tasks/[id]/comments/route.ts ile aynı kural.
 */
function fold(value) {
  return value
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/ı/g, 'i')
    .replace(/\s+/g, ' ')
    .trim();
}

// En fazla üç kelimelik ad yakalar: "@Ada", "@Ada Lovelace", "@Ada Lovelace Byron".
const MENTION_PATTERN = /@(\p{L}+(?:[ \t]+\p{L}+){0,2})/gu;

/**
 * Yorumdaki @etiketleri e-postalara çözer.
 *
 * Gövdede geçen her @ parçası için EN UZUN eşleşme denenir. Bu şart: ekipte
 * "Ada Lovelace" ve "Ada Byron" varsa "@Ada Lovelace" yazan kişi ikisini
 * birden etiketlemesin. Adları tek tek gövdede aramak bu ayrımı yapamıyor.
 */
function findMentions(body, users) {
  const index = new Map();
  for (const user of users) {
    const words = String(user.name).split(/\s+/).filter(Boolean);
    for (let count = 1; count <= words.length; count += 1) {
      const key = fold(words.slice(0, count).join(' '));
      if (key && !index.has(key)) index.set(key, user.email);
    }
  }

  const found = new Set();
  for (const match of body.matchAll(MENTION_PATTERN)) {
    const words = match[1].split(/[ \t]+/).filter(Boolean);
    for (let count = words.length; count >= 1; count -= 1) {
      const email = index.get(fold(words.slice(0, count).join(' ')));
      if (email) {
        found.add(email);
        break;
      }
    }
  }
  return [...found];
}

function stamp(value) {
  if (!value) return '';
  const iso = typeof value?.toISOString === 'function' ? value.toISOString() : String(value);
  return iso.slice(0, 16).replace('T', ' ');
}

/** Görevi iki satırda özetler: kimlik satırı + başlık. */
function taskLine(task) {
  const marks = [];
  if (task.is_blocker) marks.push('BLOCKER');
  if (task.origin_track) marks.push(`up for grabs from ${task.origin_track}`);
  if (task.labels?.length) marks.push(task.labels.join(','));
  const suffix = marks.length ? `  [${marks.join(' · ')}]` : '';
  const owner = task.assignee_name ?? task.assignee ?? 'unassigned';
  return (
    `${task.code}  ${STATUS_LABELS[task.status] ?? task.status} · Day ${task.day_no} ` +
    `· ${task.track} · ${owner}\n    ${task.title}${suffix}`
  );
}

const server = new McpServer({ name: 'sprint-board', version: '1.0.0' });

// ─────────────────────────────────────────────────────────────────────────────
// Okuma
// ─────────────────────────────────────────────────────────────────────────────

server.registerTool(
  'list_tasks',
  {
    title: 'List tasks',
    description:
      'Lists sprint tasks with optional filters. With no filters you get every task in ' +
      'day and sort order.',
    inputSchema: {
      day_no: z.number().int().positive().optional().describe('Only tasks on this day'),
      track: z.string().optional().describe('Track key, e.g. DEV'),
      status: z.enum(['todo', 'in_progress', 'blocked', 'done']).optional(),
      assignee: z.string().optional().describe('Tasks assigned to this person (email)'),
      label: z.string().optional().describe('Tasks carrying this label'),
      unassigned: z.boolean().optional().describe('true for unassigned tasks only'),
      blockers_only: z.boolean().optional().describe('true for blocker tasks only'),
    },
  },
  async (args) => {
    const where = [];
    const values = [];
    const add = (clause, value) => {
      values.push(value);
      where.push(clause.replace('?', `$${values.length}`));
    };

    if (args.day_no !== undefined) add('t.day_no = ?', args.day_no);
    if (args.track) add('upper(t.track) = upper(?)', args.track);
    if (args.status) add('t.status = ?', args.status);
    if (args.assignee) add('t.assignee = lower(?)', args.assignee);
    if (args.unassigned) where.push('t.assignee IS NULL');
    if (args.blockers_only) where.push('t.is_blocker = TRUE');
    if (args.label) {
      add(
        'EXISTS (SELECT 1 FROM task_labels l2 WHERE l2.task_id = t.id AND l2.label = lower(?))',
        args.label,
      );
    }

    const rows = await query(
      `SELECT t.*, u.name AS assignee_name,
              COALESCE(ARRAY_AGG(DISTINCT l.label) FILTER (WHERE l.label IS NOT NULL), '{}') AS labels
       FROM tasks t
       LEFT JOIN users u ON u.email = t.assignee
       LEFT JOIN task_labels l ON l.task_id = t.id
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       GROUP BY t.id, u.name
       ORDER BY t.day_no, t.sort_order, t.id`,
      values,
    );

    if (rows.length === 0) return text('No task matches that filter.');
    const heading = rows.length === 1 ? '1 task:' : `${rows.length} tasks:`;
    return text(`${heading}\n\n${rows.map(taskLine).join('\n')}`);
  },
);

server.registerTool(
  'get_task',
  {
    title: 'Task detail',
    description: 'Fetches every field of a task plus its labels and comments.',
    inputSchema: { code: z.string().describe('Task code, e.g. G1-DEV-01') },
  },
  async ({ code }) => {
    const task = await findTask(code);
    if (!task) return fail(`There is no task with the code "${code}".`);

    const comments = await query(
      `SELECT c.body, c.created_at, u.name AS author_name, c.author
       FROM comments c LEFT JOIN users u ON u.email = c.author
       WHERE c.task_id = $1 ORDER BY c.created_at`,
      [task.id],
    );

    const lines = [
      `${task.code} — ${task.title}`,
      `Status:   ${STATUS_LABELS[task.status] ?? task.status}`,
      `Day:      ${task.day_no}`,
      `Track:    ${task.track}${task.origin_track ? ` (up for grabs, originally ${task.origin_track})` : ''}`,
      `Owner:    ${task.assignee_name ?? task.assignee ?? 'unassigned'}`,
      `Blocker:  ${task.is_blocker ? 'yes' : 'no'}`,
      `Labels:   ${task.labels?.length ? task.labels.join(', ') : '—'}`,
    ];
    if (task.detail) lines.push('', `Description:\n${task.detail}`);
    if (task.output) lines.push('', `Expected output:\n${task.output}`);
    if (task.completed_at) {
      lines.push('', `Completed: ${stamp(task.completed_at)} · ${task.completed_by ?? '—'}`);
    }
    if (comments.length) {
      lines.push('', `Comments (${comments.length}):`);
      for (const comment of comments) {
        lines.push(
          `  • ${comment.author_name ?? comment.author} ${stamp(comment.created_at)}\n    ${comment.body}`,
        );
      }
    }
    return text(lines.join('\n'));
  },
);

server.registerTool(
  'sprint_summary',
  {
    title: 'Sprint summary',
    description:
      'Where the sprint stands: progress day by day, completion per person, and any open ' +
      'blockers.',
    inputSchema: {},
  },
  async () => {
    const [byStatus, byDay, byPerson, blockers, days] = await Promise.all([
      query('SELECT status, COUNT(*)::int AS n FROM tasks GROUP BY status'),
      query(
        `SELECT day_no, COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE status = 'done')::int AS done
         FROM tasks GROUP BY day_no ORDER BY day_no`,
      ),
      query(
        `SELECT u.name, u.email, u.track,
                COUNT(t.id)::int AS total,
                COUNT(t.id) FILTER (WHERE t.status = 'done')::int AS done
         FROM users u LEFT JOIN tasks t ON t.assignee = u.email
         GROUP BY u.name, u.email, u.track ORDER BY u.name`,
      ),
      query(
        `SELECT code, title, status, assignee FROM tasks
         WHERE is_blocker = TRUE AND status <> 'done' ORDER BY day_no, sort_order`,
      ),
      query('SELECT day_no, date, weekday, theme, milestone FROM sprint_days ORDER BY day_no'),
    ]);

    const counts = Object.fromEntries(byStatus.map((row) => [row.status, row.n]));
    const total = byStatus.reduce((sum, row) => sum + row.n, 0);
    const done = counts.done ?? 0;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    const lines = [`${total} tasks in total · ${pct}% done`, ''];
    for (const status of STATUSES) {
      lines.push(`  ${STATUS_LABELS[status].padEnd(14)} ${counts[status] ?? 0}`);
    }

    const dayByNo = new Map(days.map((day) => [day.day_no, day]));
    lines.push('', 'Days:');
    for (const row of byDay) {
      const day = dayByNo.get(row.day_no);
      // weekday yapılandırmada boş bırakılmış olabilir; o zaman tarih yeterli.
      const label = day ? [day.weekday, day.theme].filter(Boolean).join(' · ') : '—';
      const milestone = day?.milestone ? `  ★ ${day.milestone}` : '';
      lines.push(`  Day ${row.day_no}  ${row.done}/${row.total}  ${label}${milestone}`);
    }

    lines.push('', 'People:');
    for (const row of byPerson) {
      lines.push(`  ${row.name} (${row.track})  ${row.done}/${row.total}`);
    }

    if (blockers.length) {
      lines.push('', `Open blockers (${blockers.length}):`);
      for (const blocker of blockers) {
        lines.push(
          `  ${blocker.code} [${STATUS_LABELS[blocker.status] ?? blocker.status}] ` +
            `${blocker.title} — ${blocker.assignee ?? 'unassigned'}`,
        );
      }
    } else {
      lines.push('', 'No open blockers.');
    }

    return text(lines.join('\n'));
  },
);

server.registerTool(
  'list_activity',
  {
    title: 'Activity log',
    description: 'Who did what — newest first.',
    inputSchema: {
      limit: z.number().int().min(1).max(200).optional().describe('Defaults to 30'),
      actor: z.string().optional().describe('Only this person\'s actions (email)'),
      task_code: z.string().optional().describe('Only this task\'s history'),
    },
  },
  async ({ limit, actor, task_code: taskCode }) => {
    const where = [];
    const values = [];
    if (actor) {
      values.push(actor.trim().toLowerCase());
      where.push(`a.actor = $${values.length}`);
    }
    if (taskCode) {
      values.push(taskCode);
      where.push(`upper(a.task_code) = upper($${values.length})`);
    }
    values.push(limit ?? 30);

    const rows = await query(
      `SELECT a.*, u.name AS actor_name
       FROM activity_log a LEFT JOIN users u ON u.email = a.actor
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY a.created_at DESC, a.id DESC
       LIMIT $${values.length}`,
      values,
    );

    if (rows.length === 0) return text('Nothing recorded yet.');
    return text(
      rows
        .map((row) => {
          const from = row.from_value ? ` (${row.from_value})` : '';
          const to = row.to_value ? ` → ${row.to_value}` : '';
          const code = row.task_code ? '  ' + row.task_code : '';
          const note = row.note ? `  "${row.note}"` : '';
          return `${stamp(row.created_at)}  ${row.actor_name ?? row.actor}  ${row.action}${from}${to}${code}${note}`;
        })
        .join('\n'),
    );
  },
);

server.registerTool(
  'list_people',
  {
    title: 'List the team',
    description: 'Everyone registered on the board, their track, and whether they are an admin.',
    inputSchema: {},
  },
  async () => {
    const rows = await query('SELECT email, name, track, is_admin FROM users ORDER BY name');
    if (rows.length === 0) {
      return text('Nobody is registered — the board may not have been seeded yet.');
    }
    return text(
      rows
        .map((row) => `${row.name}  <${row.email}>  ${row.track}${row.is_admin ? '  [admin]' : ''}`)
        .join('\n'),
    );
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Yazma — hepsi activity_log'a düşer
// ─────────────────────────────────────────────────────────────────────────────

server.registerTool(
  'set_task_status',
  {
    title: 'Change task status',
    description:
      'Updates a task\'s status. Picking "done" also records who completed it and when.',
    inputSchema: {
      code: z.string().describe('Task code'),
      status: z.enum(['todo', 'in_progress', 'blocked', 'done']),
    },
  },
  async ({ code, status }) => {
    await requireActor();
    const task = await findTask(code);
    if (!task) return fail(`There is no task with the code "${code}".`);
    if (task.status === status) {
      return text(`${task.code} is already "${STATUS_LABELS[status]}"; nothing changed.`);
    }

    await query(
      `UPDATE tasks
       SET status = $1,
           completed_at = CASE WHEN $1 = 'done' THEN now() ELSE NULL END,
           completed_by = CASE WHEN $1 = 'done' THEN $2 ELSE NULL END,
           updated_at = now()
       WHERE id = $3`,
      [status, ACTOR, task.id],
    );
    await logActivity({
      action: 'status',
      task_id: task.id,
      task_code: task.code,
      from: task.status,
      to: status,
    });

    return text(
      `${task.code}: ${STATUS_LABELS[task.status]} → ${STATUS_LABELS[status]}\n` +
        `Recorded in the activity log as ${ACTOR}.`,
    );
  },
);

server.registerTool(
  'assign_task',
  {
    title: 'Assign a task',
    description:
      'Assigns a task to someone. With no email you take it on yourself. Taking on a task ' +
      'that is up for grabs is recorded as "claim", everything else as "assign". Pass ' +
      'unassign: true to clear the assignee.',
    inputSchema: {
      code: z.string().describe('Task code'),
      email: z.string().optional().describe('Email of the person to assign it to'),
      unassign: z.boolean().optional().describe('true leaves the task unassigned'),
    },
  },
  async ({ code, email, unassign }) => {
    await requireActor();
    const task = await findTask(code);
    if (!task) return fail(`There is no task with the code "${code}".`);

    let target = null;
    if (!unassign) {
      target = (email ?? ACTOR).trim().toLowerCase();
      const rows = await query('SELECT email FROM users WHERE email = $1', [target]);
      if (!rows[0]) return fail(`"${target}" is not registered on the board.`);
    }

    await query('UPDATE tasks SET assignee = $1, updated_at = now() WHERE id = $2', [
      target,
      task.id,
    ]);
    // Web tarafıyla aynı kural (app/api/tasks/[id]/route.ts): kendine atama
    // yalnızca devralınabilir bir işte "claim" sayılır, yoksa sıradan atamadır.
    await logActivity({
      action: target === ACTOR && task.origin_track ? 'claim' : 'assign',
      task_id: task.id,
      task_code: task.code,
      from: task.assignee,
      to: target,
    });

    if (!target) return text(`${task.code} is now unassigned.`);
    return text(`${task.code} → ${target}${target === ACTOR ? ' (taken on by you)' : ''}`);
  },
);

server.registerTool(
  'create_task',
  {
    title: 'Create a task',
    description:
      'Opens a new task. Without a code one is generated as G{day}-{TRACK}-{n}.',
    inputSchema: {
      day_no: z.number().int().positive().describe('The day the task belongs to'),
      track: z.string().describe('Track key'),
      title: z.string().min(1).describe('Task title'),
      detail: z.string().optional(),
      output: z.string().optional().describe('The concrete output expected'),
      assignee: z.string().optional(),
      labels: z.array(z.string()).optional(),
      is_blocker: z.boolean().optional(),
      code: z.string().optional().describe('Set the code yourself instead'),
    },
  },
  async (args) => {
    await requireActor();

    const days = await query('SELECT day_no FROM sprint_days WHERE day_no = $1', [args.day_no]);
    if (!days[0]) return fail(`Day ${args.day_no} is not defined.`);

    const track = args.track.trim().toUpperCase();
    const known = await query('SELECT track FROM users UNION SELECT track FROM tasks');
    const trackKeys = [...new Set(known.map((row) => String(row.track).toUpperCase()))];
    if (trackKeys.length > 0 && !trackKeys.includes(track)) {
      return fail(`"${track}" is not a known track. The board has: ${trackKeys.join(', ')}.`);
    }

    if (args.assignee) {
      const rows = await query('SELECT email FROM users WHERE email = $1', [
        args.assignee.trim().toLowerCase(),
      ]);
      if (!rows[0]) return fail(`"${args.assignee}" is not registered on the board.`);
    }

    let code = args.code?.trim();
    if (!code) {
      const prefix = `G${args.day_no}-${track}-`;
      const rows = await query('SELECT code FROM tasks WHERE code LIKE $1', [`${prefix}%`]);
      let max = 0;
      for (const row of rows) {
        // Elle verilmiş "G1-DEV-D01" gibi kodlar sayısal değil; atlanır.
        const match = row.code.slice(prefix.length).match(/^(\d+)$/);
        if (match) max = Math.max(max, Number(match[1]));
      }
      code = `${prefix}${String(max + 1).padStart(2, '0')}`;
    }

    const order = await query(
      'SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM tasks WHERE day_no = $1',
      [args.day_no],
    );

    let created;
    try {
      const rows = await query(
        `INSERT INTO tasks (code, day_no, track, title, detail, output, assignee,
                            is_blocker, sort_order, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id, code`,
        [
          code,
          args.day_no,
          track,
          args.title.trim(),
          args.detail?.trim() ?? null,
          args.output?.trim() ?? null,
          args.assignee?.trim().toLowerCase() ?? null,
          args.is_blocker === true,
          order[0].next,
          ACTOR,
        ],
      );
      created = rows[0];
    } catch (error) {
      // 23505: unique_violation
      if (error?.code === '23505') {
        return fail(`The code "${code}" is already taken. Pick another one.`);
      }
      throw error;
    }

    const labels = [...new Set((args.labels ?? []).map(normalizeLabel).filter(Boolean))];
    for (const label of labels) {
      await query(
        'INSERT INTO task_labels (task_id, label) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [created.id, label],
      );
    }

    await logActivity({
      action: 'create',
      task_id: created.id,
      task_code: created.code,
      to: args.title.trim(),
    });

    return text(
      `${created.code} created.${labels.length ? ` Labels: ${labels.join(', ')}` : ''}`,
    );
  },
);

server.registerTool(
  'add_comment',
  {
    title: 'Add a comment',
    description:
      'Leaves a comment on a task. Writing "@Name" in the body records a mention for the ' +
      'matching person on the board.',
    inputSchema: {
      code: z.string().describe('Task code'),
      body: z.string().min(1).describe('Comment text'),
    },
  },
  async ({ code, body }) => {
    await requireActor();
    const task = await findTask(code);
    if (!task) return fail(`There is no task with the code "${code}".`);

    const rows = await query(
      'INSERT INTO comments (task_id, author, body) VALUES ($1, $2, $3) RETURNING id',
      [task.id, ACTOR, body.trim()],
    );
    const commentId = rows[0].id;

    const people = await query('SELECT email, name FROM users');
    const mentioned = findMentions(body, people);

    for (const email of mentioned) {
      await query('INSERT INTO mentions (comment_id, task_id, mentioned) VALUES ($1, $2, $3)', [
        commentId,
        task.id,
        email,
      ]);
    }

    await logActivity({
      action: 'comment',
      task_id: task.id,
      task_code: task.code,
      note: body.trim().slice(0, 140),
    });

    const suffix = mentioned.length ? ` Mentioned: ${mentioned.join(', ')}.` : '';
    return text(`Comment added to ${task.code}.${suffix}`);
  },
);

server.registerTool(
  'set_task_labels',
  {
    title: 'Add or remove labels',
    description: 'Adds labels to a task or removes them.',
    inputSchema: {
      code: z.string().describe('Task code'),
      add: z.array(z.string()).optional().describe('Labels to add'),
      remove: z.array(z.string()).optional().describe('Labels to remove'),
    },
  },
  async ({ code, add, remove }) => {
    await requireActor();
    const task = await findTask(code);
    if (!task) return fail(`There is no task with the code "${code}".`);

    const toAdd = (add ?? []).map(normalizeLabel).filter(Boolean);
    const toRemove = (remove ?? []).map(normalizeLabel).filter(Boolean);
    if (toAdd.length === 0 && toRemove.length === 0) {
      return fail('Give at least one label to add or remove.');
    }

    for (const label of toAdd) {
      await query(
        'INSERT INTO task_labels (task_id, label) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [task.id, label],
      );
      await logActivity({ action: 'label', task_id: task.id, task_code: task.code, to: label });
    }
    for (const label of toRemove) {
      await query('DELETE FROM task_labels WHERE task_id = $1 AND label = $2', [task.id, label]);
      await logActivity({ action: 'label', task_id: task.id, task_code: task.code, from: label });
    }

    const current = await query(
      'SELECT label FROM task_labels WHERE task_id = $1 ORDER BY label',
      [task.id],
    );
    const list = current.map((row) => row.label);
    return text(`Labels on ${task.code}: ${list.length ? list.join(', ') : '—'}`);
  },
);

// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  await server.connect(new StdioServerTransport());
  // stdout JSON-RPC'ye ait; günlükler stderr'e yazılır.
  console.error(`sprint-board MCP ready · actor: ${ACTOR}`);
}

main().catch((error) => {
  console.error('Could not start the MCP server:', error?.message ?? error);
  process.exit(1);
});
