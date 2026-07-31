'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { trackStyle, type Track } from '@/lib/types';

type NavUser = {
  email: string;
  name: string;
  track: Track;
  isAdmin: boolean;
};

const LINKS: Array<{ href: string; label: string }> = [
  { href: '/', label: 'Pano' },
  { href: '/aktivite', label: 'Aktivite' },
  { href: '/ekip', label: 'Ekip' },
];

export default function TopNav({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const track = trackStyle(user.track);

  async function logout() {
    setLeaving(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/giris');
      router.refresh();
    }
  }

  function isActive(href: string): boolean {
    if (href === '/') return pathname === '/' || pathname.startsWith('/task');
    return pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-2 sm:px-6">
        <nav
          aria-label="Ana gezinme"
          className="no-scrollbar -mx-1 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto px-1"
        >
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={`flex h-11 shrink-0 items-center rounded-lg px-3 text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden min-w-0 text-right sm:block">
            <div className="truncate text-sm font-medium">{user.name}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {track.label}
              {user.isAdmin ? ' · yönetici' : ''}
            </div>
          </div>
          <span
            className={`rounded-md px-2 py-1 text-xs font-medium sm:hidden ${track.chip}`}
            title={`${user.name} · ${track.label}`}
          >
            {user.name.split(' ')[0]}
          </span>
          <button
            type="button"
            onClick={logout}
            disabled={leaving}
            className="flex h-11 shrink-0 items-center rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {leaving ? 'Çıkılıyor…' : 'Çıkış'}
          </button>
        </div>
      </div>
    </header>
  );
}
