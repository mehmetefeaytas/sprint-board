import { redirect } from 'next/navigation';
import { PROJECT_NAME } from '@/lib/config';
import { getDict } from '@/lib/i18n/server';
import { getSession } from '@/lib/session';
import type { BoardPayload } from '@/lib/types';
import { getBoard, readableDbError } from './board-data';
import { dayKey } from './format';
import BoardView from './components/board-view';
import { Notice } from './components/notice';

export default async function BoardPage() {
  const [session, { t }] = await Promise.all([getSession(), getDict()]);
  if (!session) redirect('/giris');

  let payload: BoardPayload | null = null;
  let error: string | null = null;
  try {
    payload = await getBoard(session);
  } catch (caught) {
    error = readableDbError(caught, t);
  }

  if (!payload) {
    return (
      <Notice tone="error" title={t.pages.boardLoadFailed}>
        {error}
      </Notice>
    );
  }

  return (
    <>
      <h1 className="sr-only">{PROJECT_NAME}</h1>
      <BoardView payload={payload} todayISO={dayKey()} />
    </>
  );
}
