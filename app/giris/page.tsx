import type { Metadata } from 'next';
import { PROJECT_NAME } from '@/lib/config';
import { getDict } from '@/lib/i18n/server';
import LanguageToggle from '../components/language-toggle';
import LoginForm from '../components/login-form';

// Başlık dile bağlı olduğu için statik `metadata` yerine generateMetadata.
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDict();
  return { title: `${t.pages.loginTitle} · ${PROJECT_NAME}` };
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-4">
      <LoginForm />
      {/* Üst navigasyon burada yok (oturum yok), ama dil değiştirmek için
          giriş yapmayı beklemek saçma olurdu — düğme forma eşlik ediyor. */}
      <LanguageToggle />
    </div>
  );
}
