// Üst navigasyon ve oturum düğmeleri.

const tr = {
  ariaLabel: 'Ana gezinme',
  board: 'Pano',
  activity: 'Aktivite',
  team: 'Ekip',
  admin: 'yönetici',
  logout: 'Çıkış',
  loggingOut: 'Çıkılıyor…',
  switchLanguage: (target: string) => `Dili ${target} olarak değiştir`,
};

export type NavDict = typeof tr;

const en: NavDict = {
  ariaLabel: 'Main navigation',
  board: 'Board',
  activity: 'Activity',
  team: 'Team',
  admin: 'admin',
  logout: 'Sign out',
  loggingOut: 'Signing out…',
  switchLanguage: (target: string) => `Switch language to ${target}`,
};

export const nav = { tr, en };
