import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { PROJECT_DESCRIPTION, PROJECT_NAME } from '@/lib/config';
import { getLocale } from '@/lib/i18n/server';
import { LocaleProvider } from '@/lib/i18n/provider';
import { getSession } from '@/lib/session';
import TopNav from './components/top-nav';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin', 'latin-ext'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin', 'latin-ext'],
});

export const metadata: Metadata = {
  title: PROJECT_NAME,
  description: PROJECT_DESCRIPTION,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Oturum yoksa (örn. /giris) üst navigasyon hiç render edilmez.
  const [session, locale] = await Promise.all([getSession(), getLocale()]);

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        {/* İstemci bileşenleri dili buradan okur; sözlüğü kendileri import eder. */}
        <LocaleProvider locale={locale}>
          {session ? (
            <TopNav
              user={{
                email: session.email,
                name: session.name,
                track: session.track,
                isAdmin: session.isAdmin,
              }}
            />
          ) : null}
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
            {children}
          </main>
        </LocaleProvider>
      </body>
    </html>
  );
}
