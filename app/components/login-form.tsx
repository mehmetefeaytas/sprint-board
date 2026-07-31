'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PROJECT_NAME } from '@/lib/config';

type Lookup = { exists: boolean; isAdmin: boolean };

export default function LoginForm() {
  const router = useRouter();
  const passwordRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [checkedEmail, setCheckedEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookup(mail: string): Promise<Lookup | null> {
    const response = await fetch(`/api/auth/login?email=${encodeURIComponent(mail)}`);
    if (!response.ok) {
      setError('E-posta kontrol edilemedi. Tekrar deneyin.');
      return null;
    }
    const body = (await response.json()) as Partial<Lookup>;
    return { exists: body.exists === true, isAdmin: body.isAdmin === true };
  }

  // Yazma durduktan kısa süre sonra sessizce kontrol: kişi yönetici mi?
  // Bilinçli olarak onBlur DEĞİL — alandan çıkıp düğmeye basıldığında blur'un
  // tetiklediği yeniden çizim tıklamayı yutuyordu (canlıda gecikme daha uzun
  // olduğu için hep tekrar tıklamak gerekiyordu).
  useEffect(() => {
    const mail = email.trim().toLowerCase();
    if (!mail || !mail.includes('@') || mail === checkedEmail) return;
    const timer = window.setTimeout(async () => {
      try {
        const info = await lookup(mail);
        if (!info) return;
        setCheckedEmail(mail);
        setNeedsPassword(info.exists && info.isAdmin);
      } catch {
        // Sessiz geç: gönderimde tekrar denenecek.
      }
    }, 400);
    return () => window.clearTimeout(timer);
    // lookup bileşen kapsamında sabit; yalnızca e-posta değişimi izlenir.
  }, [email, checkedEmail]);

  // Şifre alanı açıldığında imleci oraya al.
  useEffect(() => {
    if (needsPassword) passwordRef.current?.focus();
  }, [needsPassword]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const mail = email.trim().toLowerCase();
    setError(null);
    if (!mail) {
      setError('E-posta adresinizi yazın.');
      return;
    }

    setBusy(true);
    try {
      let admin = needsPassword;
      if (checkedEmail !== mail) {
        const info = await lookup(mail);
        if (!info) return;
        setCheckedEmail(mail);
        if (!info.exists) {
          setError('Bu e-posta ekip listesinde yok. Sistem yöneticisinden eklenmesini isteyin.');
          setNeedsPassword(false);
          return;
        }
        admin = info.isAdmin;
        setNeedsPassword(info.isAdmin);
        if (info.isAdmin && !password) {
          window.setTimeout(() => passwordRef.current?.focus(), 0);
          setError('Bu hesap için şifre gerekli.');
          return;
        }
      }

      if (admin && !password) {
        window.setTimeout(() => passwordRef.current?.focus(), 0);
        setError('Bu hesap için şifre gerekli.');
        return;
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(admin ? { email: mail, password } : { email: mail }),
      });

      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        const fromServer =
          body && typeof body === 'object' && 'error' in body
            ? String((body as { error: unknown }).error)
            : null;
        if (response.status === 403) {
          setError(
            fromServer ??
              'Bu e-posta ekip listesinde yok. Sistem yöneticisinden eklenmesini isteyin.',
          );
        } else if (response.status === 401) {
          setError(fromServer ?? 'Şifre hatalı.');
          setNeedsPassword(true);
          window.setTimeout(() => passwordRef.current?.focus(), 0);
        } else {
          setError(fromServer ?? 'Giriş yapılamadı. Tekrar deneyin.');
        }
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('Sunucuya ulaşılamadı. Bağlantınızı kontrol edin.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
    >
      <h1 className="text-xl font-semibold">{PROJECT_NAME}</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        E-posta adresinizle giriş yapın.
      </p>

      <label className="mt-5 block">
        <span className="text-sm font-medium">E-posta</span>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="ad@ornek.com"
          className="mt-1 h-12 w-full rounded-lg border border-slate-300 bg-transparent px-3 text-base dark:border-slate-700"
        />
      </label>

      {needsPassword ? (
        <label className="mt-3 block">
          <span className="text-sm font-medium">Şifre</span>
          <input
            ref={passwordRef}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 h-12 w-full rounded-lg border border-slate-300 bg-transparent px-3 text-base dark:border-slate-700"
          />
          <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
            Bu hesap sistem yöneticisi olduğu için şifre isteniyor.
          </span>
        </label>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-3 rounded-lg bg-rose-50 p-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-200"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="mt-5 h-12 w-full rounded-lg bg-slate-900 text-sm font-medium text-white disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
      >
        {busy ? 'Giriş yapılıyor…' : 'Giriş yap'}
      </button>

      <p className="mt-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        Giriş yalnızca kim ne yaptı takibi için; şifre yalnızca sistem yöneticisinden istenir.
      </p>
    </form>
  );
}
