import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { PROJECT_NAME, PROTECTED_EMAILS } from '@/lib/config';
import { getDict } from '@/lib/i18n/server';
import { getTasks, getUsers, readableDbError } from '../board-data';
import TeamList, { type Member } from '../components/team-list';
import NewUserForm from '../components/new-user-form';
import { Notice } from '../components/notice';

// Başlık dile bağlı olduğu için statik `metadata` yerine generateMetadata.
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: `${t.pages.teamTitle} · ${PROJECT_NAME}` };
}

export default async function TeamPage() {
  const [session, { t }] = await Promise.all([getSession(), getDict()]);
  if (!session) redirect('/giris');

  let members: Member[] | null = null;
  let error: string | null = null;
  try {
    const [users, tasks] = await Promise.all([getUsers(), getTasks()]);
    members = users.map((user) => {
      const own = tasks.filter((task) => task.assignee === user.email);
      return {
        user,
        total: own.length,
        done: own.filter((task) => task.status === 'done').length,
      };
    });
  } catch (caught) {
    error = readableDbError(caught, t);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">{t.pages.teamTitle}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.pages.teamIntro}</p>
      </div>

      {members ? (
        <>
          <TeamList members={members} isAdmin={session.isAdmin} protectedEmails={PROTECTED_EMAILS} />
          {/* Form yalnızca yönetici için render edilir. */}
          {session.isAdmin ? <NewUserForm /> : null}
        </>
      ) : (
        <Notice tone="error" title={t.pages.teamLoadFailed}>
          {error}
        </Notice>
      )}
    </div>
  );
}
