import { db } from '@/lib/db';
import { logActivity } from '@/lib/audit';
import type { CommentRow } from '@/lib/types';
import { auth, failT, parseId, readJson } from '../../../_util';

type CommentBody = { body?: unknown };

/** @isim eşleşmesi büyük/küçük harf ve Türkçe karakter duyarsız olmalı. */
function fold(value: string): string {
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

/** İsim → e-posta sözlüğü; her adın tüm baştan kısaltmaları anahtar olur. */
function buildNameIndex(users: { email: string; name: string }[]): Map<string, string> {
  const index = new Map<string, string>();
  for (const user of users) {
    const words = user.name.split(/\s+/).filter(Boolean);
    for (let count = 1; count <= words.length; count += 1) {
      const key = fold(words.slice(0, count).join(' '));
      if (key && !index.has(key)) index.set(key, user.email);
    }
  }
  return index;
}

function findMentions(body: string, index: Map<string, string>): string[] {
  const found = new Set<string>();
  for (const match of body.matchAll(MENTION_PATTERN)) {
    const words = match[1].split(/[ \t]+/).filter(Boolean);
    // Uzun eşleşme önce denenir: "Ada Lovelace" > "Ada".
    for (let count = words.length; count >= 1; count -= 1) {
      const email = index.get(fold(words.slice(0, count).join(' ')));
      if (email) {
        found.add(email);
        break;
      }
    }
  }
  return Array.from(found);
}

const COMMENT_SELECT = `
  SELECT c.id,
         c.task_id,
         c.author,
         COALESCE(u.name, c.author) AS author_name,
         c.body,
         c.created_at,
         COALESCE(ARRAY_AGG(DISTINCT m.mentioned) FILTER (WHERE m.mentioned IS NOT NULL), '{}') AS mentions
  FROM comments c
  LEFT JOIN users u ON u.email = c.author
  LEFT JOIN mentions m ON m.comment_id = c.id
`;

async function fetchComments(taskId: number): Promise<CommentRow[]> {
  const sql = db();
  const rows = await sql.query(
    `${COMMENT_SELECT} WHERE c.task_id = $1 GROUP BY c.id, u.name ORDER BY c.created_at ASC, c.id ASC`,
    [taskId],
  );
  return rows as unknown as CommentRow[];
}

async function fetchComment(commentId: number): Promise<CommentRow | null> {
  const sql = db();
  const rows = await sql.query(`${COMMENT_SELECT} WHERE c.id = $1 GROUP BY c.id, u.name`, [
    commentId,
  ]);
  return (rows as unknown as CommentRow[])[0] ?? null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const guard = await auth();
  if ('response' in guard) return guard.response;

  const id = parseId((await params).id);
  if (id === null) return failT((m) => m.request.invalidTaskId, 400);

  try {
    return Response.json(await fetchComments(id));
  } catch {
    return failT((m) => m.comment.readFailed, 500);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const guard = await auth();
  if ('response' in guard) return guard.response;

  const id = parseId((await params).id);
  if (id === null) return failT((m) => m.request.invalidTaskId, 400);

  const payload = await readJson<CommentBody>(request);
  const text = typeof payload?.body === 'string' ? payload.body.trim() : '';
  if (text === '') return failT((m) => m.comment.empty, 400);

  try {
    const sql = db();

    const taskRows = (await sql`
      SELECT id, code FROM tasks WHERE id = ${id}
    `) as unknown as { id: number; code: string }[];
    const task = taskRows[0];
    if (!task) return failT((m) => m.task.notFound, 404);

    const inserted = (await sql`
      INSERT INTO comments (task_id, author, body)
      VALUES (${id}, ${guard.user.email}, ${text})
      RETURNING id
    `) as unknown as { id: number }[];
    const commentId = inserted[0]?.id;
    if (commentId === undefined) return failT((m) => m.comment.saveFailed, 500);

    const users = (await sql`SELECT email, name FROM users`) as unknown as {
      email: string;
      name: string;
    }[];
    for (const mentioned of findMentions(text, buildNameIndex(users))) {
      await sql`
        INSERT INTO mentions (comment_id, task_id, mentioned)
        VALUES (${commentId}, ${id}, ${mentioned})
      `;
    }

    await logActivity({
      actor: guard.user.email,
      action: 'comment',
      taskId: task.id,
      taskCode: task.code,
      note: text.slice(0, 120),
    });

    const comment = await fetchComment(commentId);
    if (!comment) return failT((m) => m.comment.savedButUnreadable, 500);
    return Response.json(comment, { status: 201 });
  } catch {
    return failT((m) => m.comment.saveFailed, 500);
  }
}
