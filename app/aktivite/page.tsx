import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PROJECT_NAME } from '@/lib/config';
import { getDict } from '@/lib/i18n/server';
import { getSession } from '@/lib/session';
import type { ActivityRow, UserRow } from '@/lib/types';
import { getActivity, getUsers, readableDbError } from '../board-data';
import { dayKey } from '../format';
import ActivityList from '../components/activity-list';
import { Notice } from '../components/notice';

/** Listede gösterilen kayıt sayısı — açıklama satırı da bu değeri yazar. */
const ACTIVITY_LIMIT = 300;

// Başlık dile bağlı olduğu için statik `metadata` yerine generateMetadata.
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: `${t.pages.activityTitle} · ${PROJECT_NAME}` };
}

export default async function ActivityPage() {
  const [session, { t }] = await Promise.all([getSession(), getDict()]);
  if (!session) redirect('/giris');

  let entries: ActivityRow[] | null = null;
  let users: UserRow[] = [];
  let error: string | null = null;
  try {
    [entries, users] = await Promise.all([getActivity(ACTIVITY_LIMIT), getUsers()]);
  } catch (caught) {
    error = readableDbError(caught, t);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">{t.pages.activityTitle}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t.pages.activityIntro(ACTIVITY_LIMIT)}
        </p>
      </div>

      {entries ? (
        <ActivityList
          entries={entries}
          users={users}
          todayISO={dayKey()}
        />
      ) : (
        <Notice tone="error" title={t.pages.activityLoadFailed}>
          {error}
        </Notice>
      )}
    </div>
  );
}
