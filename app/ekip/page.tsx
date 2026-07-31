import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { PROJECT_NAME, PROTECTED_EMAILS } from '@/lib/config';
import { getTasks, getUsers, readableDbError } from '../board-data';
import TeamList, { type Member } from '../components/team-list';
import NewUserForm from '../components/new-user-form';
import { Notice } from '../components/notice';

export const metadata: Metadata = {
  title: `Ekip · ${PROJECT_NAME}`,
};

export default async function TeamPage() {
  const session = await getSession();
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
    error = readableDbError(caught);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Ekip</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Kim hangi track&apos;te, kaç görev almış ve ne kadarını bitirmiş.
        </p>
      </div>

      {members ? (
        <>
          <TeamList members={members} isAdmin={session.isAdmin} protectedEmails={PROTECTED_EMAILS} />
          {/* Form yalnızca yönetici için render edilir. */}
          {session.isAdmin ? <NewUserForm /> : null}
        </>
      ) : (
        <Notice tone="error" title="Ekip listesi yüklenemedi">
          {error}
        </Notice>
      )}
    </div>
  );
}
