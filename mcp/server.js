#!/usr/bin/env node
// Sprint Board MCP sunucusu — stdio üzerinden çalışır.
//
// Claude Code, Codex, OpenCode ve MCP konuşan diğer araçlar panoyu bu sunucu
// üzerinden okur ve günceller. Kurulum: mcp/README.md
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
  todo: 'Yapılacak',
  in_progress: 'Devam ediyor',
  blocked: 'Bloke',
  done: 'Tamamlandı',
};

const DATABASE_URL = process.env.DATABASE_URL;
const ACTOR = (process.env.SPRINT_BOARD_ACTOR ?? '').trim().toLowerCase();

if (!DATABASE_URL) {
  console.error(
    'DATABASE_URL tanımlı değil. Panonun veritabanı adresini ver:\n' +
      '  DATABASE_URL=postgres://... SPRINT_BOARD_ACTOR=sen@ornek.com node mcp/server.js',
  );
  process.exit(1);
}
if (!ACTOR || !ACTOR.includes('@')) {
  console.error(
    'SPRINT_BOARD_ACTOR tanımlı değil veya e-posta değil.\n' +
      'Yaptığın değişiklikler aktivite kaydına bu kişi adına yazılır; panoda\n' +
      'kayıtlı bir e-posta olmalı.',
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
      `"${ACTOR}" panoda kayıtlı değil. sprint.config.ts içindeki users listesine ekleyip ` +
        'yeniden tohumla, ya da SPRINT_BOARD_ACTOR değerini kayıtlı bir e-postaya çevir.',
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
  return { content: [{ type: 'text', text: `Hata: ${message}` }], isError: true };
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
    .replace(/\u0131/g, 'i')
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
  if (task.is_blocker) marks.push('BLOKER');
  if (task.origin_track) marks.push(`devralınabilir←${task.origin_track}`);
  if (task.labels?.length) marks.push(task.labels.join(','));
  const suffix = marks.length ? `  [${marks.join(' · ')}]` : '';
  const owner = task.assignee_name ?? task.assignee ?? 'sahipsiz';
  return (
    `${task.code}  ${STATUS_LABELS[task.status] ?? task.status} · G${task.day_no} ` +
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
    title: 'Görevleri listele',
    description:
      'Sprint görevlerini filtreleyerek listeler. Filtre verilmezse tüm görevler ' +
      'gün ve sıra düzeninde döner.',
    inputSchema: {
      day_no: z.number().int().positive().optional().describe('Yalnızca bu günün görevleri'),
      track: z.string().optional().describe('Track anahtarı (ör. DEV)'),
      status: z.enum(['todo', 'in_progress', 'blocked', 'done']).optional(),
      assignee: z.string().optional().describe('Bu kişiye atanmış görevler (e-posta)'),
      label: z.string().optional().describe('Bu etikete sahip görevler'),
      unassigned: z.boolean().optional().describe('true ise yalnızca sahipsiz görevler'),
      blockers_only: z.boolean().optional().describe('true ise yalnızca bloker görevler'),
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

    if (rows.length === 0) return text('Bu filtreye uyan görev yok.');
    return text(`${rows.length} görev:\n\n${rows.map(taskLine).join('\n')}`);
  },
);

server.registerTool(
  'get_task',
  {
    title: 'Görev detayı',
    description: 'Bir görevin tüm alanlarını, etiketlerini ve yorumlarını getirir.',
    inputSchema: { code: z.string().describe('Görev kodu, ör. G1-DEV-01') },
  },
  async ({ code }) => {
    const task = await findTask(code);
    if (!task) return fail(`"${code}" kodlu görev yok.`);

    const comments = await query(
      `SELECT c.body, c.created_at, u.name AS author_name, c.author
       FROM comments c LEFT JOIN users u ON u.email = c.author
       WHERE c.task_id = $1 ORDER BY c.created_at`,
      [task.id],
    );

    const lines = [
      `${task.code} — ${task.title}`,
      `Durum:   ${STATUS_LABELS[task.status] ?? task.status}`,
      `Gün:     ${task.day_no}`,
      `Track:   ${task.track}${task.origin_track ? ` (devralınabilir, kaynak: ${task.origin_track})` : ''}`,
      `Sahip:   ${task.assignee_name ?? task.assignee ?? 'sahipsiz'}`,
      `Bloker:  ${task.is_blocker ? 'evet' : 'hayır'}`,
      `Etiket:  ${task.labels?.length ? task.labels.join(', ') : '—'}`,
    ];
    if (task.detail) lines.push('', `Açıklama:\n${task.detail}`);
    if (task.output) lines.push('', `Beklenen çıktı:\n${task.output}`);
    if (task.completed_at) {
      lines.push('', `Tamamlandı: ${stamp(task.completed_at)} · ${task.completed_by ?? '—'}`);
    }
    if (comments.length) {
      lines.push('', `Yorumlar (${comments.length}):`);
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
    title: 'Sprint özeti',
    description:
      "Sprint'in genel durumu: gün gün ilerleme, kişi başı tamamlama oranı ve " +
      'açık blokerler.',
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

    const lines = [`Toplam ${total} görev · %${pct} tamamlandı`, ''];
    for (const status of STATUSES) {
      lines.push(`  ${STATUS_LABELS[status].padEnd(14)} ${counts[status] ?? 0}`);
    }

    const dayByNo = new Map(days.map((day) => [day.day_no, day]));
    lines.push('', 'Günler:');
    for (const row of byDay) {
      const day = dayByNo.get(row.day_no);
      const label = day ? `${day.weekday} · ${day.theme}` : '—';
      const milestone = day?.milestone ? `  ★ ${day.milestone}` : '';
      lines.push(`  G${row.day_no}  ${row.done}/${row.total}  ${label}${milestone}`);
    }

    lines.push('', 'Kişiler:');
    for (const row of byPerson) {
      lines.push(`  ${row.name} (${row.track})  ${row.done}/${row.total}`);
    }

    if (blockers.length) {
      lines.push('', `Açık bloker (${blockers.length}):`);
      for (const blocker of blockers) {
        lines.push(
          `  ${blocker.code} [${STATUS_LABELS[blocker.status] ?? blocker.status}] ` +
            `${blocker.title} — ${blocker.assignee ?? 'sahipsiz'}`,
        );
      }
    } else {
      lines.push('', 'Açık bloker yok.');
    }

    return text(lines.join('\n'));
  },
);

server.registerTool(
  'list_activity',
  {
    title: 'Aktivite kaydı',
    description: 'Kim ne yaptı — en yeni kayıt üstte.',
    inputSchema: {
      limit: z.number().int().min(1).max(200).optional().describe('Varsayılan 30'),
      actor: z.string().optional().describe('Yalnızca bu kişinin hareketleri (e-posta)'),
      task_code: z.string().optional().describe('Yalnızca bu görevin geçmişi'),
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

    if (rows.length === 0) return text('Kayıt yok.');
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
    title: 'Ekibi listele',
    description: "Panoya kayıtlı kişiler, track'leri ve yönetici durumu.",
    inputSchema: {},
  },
  async () => {
    const rows = await query('SELECT email, name, track, is_admin FROM users ORDER BY name');
    if (rows.length === 0) return text('Kayıtlı kişi yok — pano henüz tohumlanmamış olabilir.');
    return text(
      rows
        .map((row) => `${row.name}  <${row.email}>  ${row.track}${row.is_admin ? '  [yönetici]' : ''}`)
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
    title: 'Görev durumunu değiştir',
    description:
      'Görevin durumunu güncellendirir. "done" seçilirse tamamlama zamanı ve ' +
      'tamamlayan kişi de yazılır.',
    inputSchema: {
      code: z.string().describe('Görev kodu'),
      status: z.enum(['todo', 'in_progress', 'blocked', 'done']),
    },
  },
  async ({ code, status }) => {
    await requireActor();
    const task = await findTask(code);
    if (!task) return fail(`"${code}" kodlu görev yok.`);
    if (task.status === status) {
      return text(`${task.code} zaten "${STATUS_LABELS[status]}" durumunda; değişiklik yapılmadı.`);
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
        `Aktivite kaydına ${ACTOR} adına yazıldı.`,
    );
  },
);

server.registerTool(
  'assign_task',
  {
    title: 'Görev ata',
    description:
      'Görevi bir kişiye atar. E-posta verilmezse görevi aktörün kendisi üstlenir ' +
      '(aktivite kaydında "claim" olarak görünür). Atamayı kaldırmak için ' +
      'unassign: true kullan.',
    inputSchema: {
      code: z.string().describe('Görev kodu'),
      email: z.string().optional().describe('Atanacak kişinin e-postası'),
      unassign: z.boolean().optional().describe('true ise görev sahipsiz kalır'),
    },
  },
  async ({ code, email, unassign }) => {
    await requireActor();
    const task = await findTask(code);
    if (!task) return fail(`"${code}" kodlu görev yok.`);

    let target = null;
    if (!unassign) {
      target = (email ?? ACTOR).trim().toLowerCase();
      const rows = await query('SELECT email FROM users WHERE email = $1', [target]);
      if (!rows[0]) return fail(`"${target}" panoda kayıtlı değil.`);
    }

    await query('UPDATE tasks SET assignee = $1, updated_at = now() WHERE id = $2', [
      target,
      task.id,
    ]);
    // Kendine almak ile başkasına atamak aynı şey değil; kayıtta ayrışsın.
    await logActivity({
      action: target === ACTOR ? 'claim' : 'assign',
      task_id: task.id,
      task_code: task.code,
      from: task.assignee,
      to: target,
    });

    if (!target) return text(`${task.code} sahipsiz bırakıldı.`);
    return text(`${task.code} → ${target}${target === ACTOR ? ' (kendine alındı)' : ''}`);
  },
);

server.registerTool(
  'create_task',
  {
    title: 'Görev oluştur',
    description:
      'Yeni görev açar. Kod verilmezse G{gün}-{TRACK}-{sıra} biçiminde otomatik üretilir.',
    inputSchema: {
      day_no: z.number().int().positive().describe('Görevin bağlanacağı gün'),
      track: z.string().describe('Track anahtarı'),
      title: z.string().min(1).describe('Görev başlığı'),
      detail: z.string().optional(),
      output: z.string().optional().describe('Beklenen somut çıktı'),
      assignee: z.string().optional(),
      labels: z.array(z.string()).optional(),
      is_blocker: z.boolean().optional(),
      code: z.string().optional().describe('Elle kod vermek istersen'),
    },
  },
  async (args) => {
    await requireActor();

    const days = await query('SELECT day_no FROM sprint_days WHERE day_no = $1', [args.day_no]);
    if (!days[0]) return fail(`Gün ${args.day_no} tanımlı değil.`);

    const track = args.track.trim().toUpperCase();
    const known = await query(
      'SELECT track FROM users UNION SELECT track FROM tasks',
    );
    const trackKeys = [...new Set(known.map((row) => String(row.track).toUpperCase()))];
    if (trackKeys.length > 0 && !trackKeys.includes(track)) {
      return fail(`"${track}" bilinen bir track değil. Panodaki track'ler: ${trackKeys.join(', ')}.`);
    }

    if (args.assignee) {
      const rows = await query('SELECT email FROM users WHERE email = $1', [
        args.assignee.trim().toLowerCase(),
      ]);
      if (!rows[0]) return fail(`"${args.assignee}" panoda kayıtlı değil.`);
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
        return fail(`"${code}" kodu zaten kullanılıyor. Başka bir kod ver.`);
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
      `${created.code} oluşturuldu.${labels.length ? ` Etiketler: ${labels.join(', ')}` : ''}`,
    );
  },
);

server.registerTool(
  'add_comment',
  {
    title: 'Yorum ekle',
    description:
      'Göreve yorum bırakır. Gövdede "@Ad" yazarsan panodaki kişiyle eşleşen ' +
      'etiketler mention olarak kaydedilir.',
    inputSchema: {
      code: z.string().describe('Görev kodu'),
      body: z.string().min(1).describe('Yorum metni'),
    },
  },
  async ({ code, body }) => {
    await requireActor();
    const task = await findTask(code);
    if (!task) return fail(`"${code}" kodlu görev yok.`);

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

    const suffix = mentioned.length ? ` Etiketlenenler: ${mentioned.join(', ')}.` : '';
    return text(`${task.code} görevine yorum eklendi.${suffix}`);
  },
);

server.registerTool(
  'set_task_labels',
  {
    title: 'Etiket ekle/çıkar',
    description: 'Göreve etiket ekler veya çıkarır.',
    inputSchema: {
      code: z.string().describe('Görev kodu'),
      add: z.array(z.string()).optional().describe('Eklenecek etiketler'),
      remove: z.array(z.string()).optional().describe('Çıkarılacak etiketler'),
    },
  },
  async ({ code, add, remove }) => {
    await requireActor();
    const task = await findTask(code);
    if (!task) return fail(`"${code}" kodlu görev yok.`);

    const toAdd = (add ?? []).map(normalizeLabel).filter(Boolean);
    const toRemove = (remove ?? []).map(normalizeLabel).filter(Boolean);
    if (toAdd.length === 0 && toRemove.length === 0) {
      return fail('Eklenecek veya çıkarılacak en az bir etiket ver.');
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
    return text(`${task.code} etiketleri: ${list.length ? list.join(', ') : '—'}`);
  },
);

// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  await server.connect(new StdioServerTransport());
  // stdout JSON-RPC'ye ait; günlükler stderr'e yazılır.
  console.error(`sprint-board MCP hazır · aktör: ${ACTOR}`);
}

main().catch((error) => {
  console.error('MCP sunucusu başlatılamadı:', error?.message ?? error);
  process.exit(1);
});
