// Giriş ekranı. Proje adı yapılandırmadan gelir, sözlükte yer almaz.
//
// Kalıp: tr yazılır, tip ondan türetilir, en o tipe uymak zorundadır.

const tr = {
  subtitle: 'E-posta adresinizle giriş yapın.',
  emailLabel: 'E-posta',
  emailPlaceholder: 'ad@ornek.com',
  passwordLabel: 'Şifre',
  passwordHint: 'Bu hesap sistem yöneticisi olduğu için şifre isteniyor.',
  signIn: 'Giriş yap',
  signingIn: 'Giriş yapılıyor…',
  footnote: 'Giriş yalnızca kim ne yaptı takibi için; şifre yalnızca sistem yöneticisinden istenir.',

  error: {
    emailRequired: 'E-posta adresinizi yazın.',
    lookupFailed: 'E-posta kontrol edilemedi. Tekrar deneyin.',
    notOnTeam: 'Bu e-posta ekip listesinde yok. Sistem yöneticisinden eklenmesini isteyin.',
    passwordRequired: 'Bu hesap için şifre gerekli.',
    wrongPassword: 'Şifre hatalı.',
    failed: 'Giriş yapılamadı. Tekrar deneyin.',
  },
};

export type AuthDict = typeof tr;

const en: AuthDict = {
  subtitle: 'Sign in with your email address.',
  emailLabel: 'Email',
  emailPlaceholder: 'name@example.com',
  passwordLabel: 'Password',
  passwordHint: 'This account is a system admin, so a password is required.',
  signIn: 'Sign in',
  signingIn: 'Signing in…',
  footnote: 'Signing in only records who did what; a password is asked of system admins only.',

  error: {
    emailRequired: 'Enter your email address.',
    lookupFailed: "Couldn't check that email. Try again.",
    notOnTeam: 'That email is not on the team list. Ask a system admin to add it.',
    passwordRequired: 'This account needs a password.',
    wrongPassword: 'Wrong password.',
    failed: "Couldn't sign in. Try again.",
  },
};

export const auth = { tr, en };
