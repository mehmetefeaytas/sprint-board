import type { Metadata } from 'next';
import { PROJECT_NAME } from '@/lib/config';
import LoginForm from '../components/login-form';

export const metadata: Metadata = {
  title: `Giriş · ${PROJECT_NAME}`,
};

export default function LoginPage() {
  return (
    <div className="flex min-h-[70dvh] items-center justify-center">
      <LoginForm />
    </div>
  );
}
