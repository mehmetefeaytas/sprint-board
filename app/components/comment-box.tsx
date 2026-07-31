'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CommentRow, UserRow } from '@/lib/types';
import { activityTime, splitMentions } from '../format';
import { EmptyState } from './notice';

type Props = {
  taskId: number;
  initialComments: CommentRow[];
  users: UserRow[];
  todayISO: string;
};

/** İmleçten hemen önceki "@ad" parçası. */
const MENTION_TOKEN = /@([\p{L}]*)$/u;

function lower(value: string): string {
  return value.toLocaleLowerCase('tr-TR');
}

export default function CommentBox({ taskId, initialComments, users, todayISO }: Props) {
  const router = useRouter();
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const [comments, setComments] = useState<CommentRow[]>(initialComments);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<UserRow[]>([]);
  const [highlight, setHighlight] = useState(0);

  const names = users.map((user) => user.name);

  function refreshSuggestions(value: string, caret: number) {
    const match = value.slice(0, caret).match(MENTION_TOKEN);
    if (!match) {
      setSuggestions([]);
      return;
    }
    const query = lower(match[1]);
    const found = users.filter((user) => !query || lower(user.name).includes(query));
    setSuggestions(found.slice(0, 5));
    setHighlight(0);
  }

  function pick(user: UserRow) {
    const area = areaRef.current;
    const caret = area?.selectionStart ?? body.length;
    const match = body.slice(0, caret).match(MENTION_TOKEN);
    if (!match) return;
    const start = caret - match[0].length;
    const next = body.slice(0, start) + '@' + user.name + ' ' + body.slice(caret);
    setBody(next);
    setSuggestions([]);
    const position = start + user.name.length + 2;
    window.setTimeout(() => {
      area?.focus();
      area?.setSelectionRange(position, position);
    }, 0);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const text = body.trim();
    if (!text) return;
    setSending(true);
    setError(null);
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text }),
      });
      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => null);
        const message =
          payload && typeof payload === 'object' && 'error' in payload
            ? String((payload as { error: unknown }).error)
            : 'Yorum gönderilemedi.';
        setError(message);
        return;
      }
      const created = (await response.json()) as CommentRow;
      setComments((list) => [...list, created]);
      setBody('');
      router.refresh();
    } catch {
      setError('Sunucuya ulaşılamadı. Yorum gönderilemedi.');
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-base font-semibold">Yorumlar ({comments.length})</h2>

      {comments.length === 0 ? (
        <div className="mt-3">
          <EmptyState>Henüz yorum yok. İlk notu siz yazın.</EmptyState>
        </div>
      ) : (
        <ul className="mt-3 space-y-3">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="rounded-lg border border-slate-200 p-3 dark:border-slate-800"
            >
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-sm font-medium">{comment.author_name}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {activityTime(comment.created_at, todayISO)}
                </span>
              </div>
              <p className="mt-1 text-sm whitespace-pre-wrap">
                {splitMentions(comment.body, names).map((part, index) =>
                  part.mention ? (
                    <span
                      key={index}
                      className="rounded bg-sky-100 px-1 font-medium text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                    >
                      {part.text}
                    </span>
                  ) : (
                    <span key={index}>{part.text}</span>
                  ),
                )}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="relative mt-4">
        <label className="block">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Yeni yorum — birini etiketlemek için @ yazın
          </span>
          <textarea
            ref={areaRef}
            rows={3}
            value={body}
            onChange={(event) => {
              setBody(event.target.value);
              refreshSuggestions(event.target.value, event.target.selectionStart ?? 0);
            }}
            onKeyDown={(event) => {
              if (suggestions.length === 0) return;
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setHighlight((index) => (index + 1) % suggestions.length);
              } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setHighlight((index) => (index - 1 + suggestions.length) % suggestions.length);
              } else if (event.key === 'Enter' || event.key === 'Tab') {
                event.preventDefault();
                const chosen = suggestions[highlight];
                if (chosen) pick(chosen);
              } else if (event.key === 'Escape') {
                setSuggestions([]);
              }
            }}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
          />
        </label>

        {suggestions.length > 0 ? (
          <ul className="absolute right-0 bottom-14 left-0 z-20 max-h-48 overflow-y-auto rounded-lg border border-slate-300 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
            {suggestions.map((user, index) => (
              <li key={user.email}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => pick(user)}
                  className={`flex h-11 w-full items-center px-3 text-left text-sm ${
                    index === highlight ? 'bg-slate-100 dark:bg-slate-700' : ''
                  }`}
                >
                  @{user.name}
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="mt-2 rounded-lg bg-rose-50 p-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-200"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={sending || !body.trim()}
          className="mt-2 h-11 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
        >
          {sending ? 'Gönderiliyor…' : 'Yorum ekle'}
        </button>
      </form>
    </section>
  );
}
