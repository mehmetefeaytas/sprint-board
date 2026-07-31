import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PROJECT_NAME } from '@/lib/config';
import { getSession } from '@/lib/session';
import { ACTION_LABELS } from '@/lib/audit';
import type { ActivityRow, UserRow } from '@/lib/types';
import { getActivity, getUsers, readableDbError } from '../board-data';
import { dayKey } from '../format';
import ActivityList from '../components/activity-list';
import { Notice } from '../components/notice';

export const metadata: Metadata = {
  title: `Aktivite · ${PROJECT_NAME}`,
};

export default async function ActivityPage() {
  const session = await getSession();
  if (!session) redirect('/giris');

  let entries: ActivityRow[] | null = null;
  let users: UserRow[] = [];
  let error: string | null = null;
  try {
    [entries, users] = await Promise.all([getActivity(300), getUsers()]);
  } catch (caught) {
    error = readableDbError(caught);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Aktivite</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Kim ne yaptı — en yeni kayıt üstte. Son 300 hareket gösterilir.
        </p>
      </div>

      {entries ? (
        <ActivityList
          entries={entries}
          users={users}
          actionLabels={ACTION_LABELS}
          todayISO={dayKey()}
        />
      ) : (
        <Notice tone="error" title="Aktivite kaydı yüklenemedi">
          {error}
        </Notice>
      )}
    </div>
  );
}
